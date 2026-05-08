import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "node:crypto";

import { redis } from "../redis";
import { SYNC_KEY } from "./redis-keys";
import type { SyncTokenClaims } from "./types";

const ACCESS_TOKEN_TTL_SEC = 24 * 60 * 60; // 24 hours
const QR_TOKEN_TTL_SEC = 5 * 60; // 5 minutes
const EXCHANGE_CODE_TTL_SEC = 10 * 60; // 10 minutes

const ISSUER = "dunamis-sync" as const;
const AUDIENCE = "dunamis-sync-client" as const;

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    throw new Error(
      "JWT_SECRET is not configured. Required for Sync auth tokens.",
    );
  }
  return new TextEncoder().encode(raw);
}

/**
 * Mint a long-lived (24h) Bearer access token for a customer. Atelier
 * receives this from the post-checkout deep-link flow; the PWA
 * receives it from the QR-scan handshake. Subsequent API calls carry
 * it as `Authorization: Bearer <token>`.
 */
export async function issueAccessToken(customerId: string): Promise<{
  token: string;
  exp: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ACCESS_TOKEN_TTL_SEC;
  const token = await new SignJWT({ cid: customerId, kind: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(exp)
    .sign(getSecret());
  return { token, exp };
}

/**
 * Mint a 5-minute QR pairing token. Atelier embeds this in the QR
 * payload along with the AES key + customer id; the PWA scans it,
 * verifies via /api/sync/auth/exchange, and trades it for an access
 * token. The short TTL is deliberate — see CLAUDE.md §12.3 hold-to-
 * reveal rules; even if a screenshot leaks, the QR is dead in 5 min.
 */
export async function issueQrToken(customerId: string): Promise<{
  token: string;
  exp: number;
}> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + QR_TOKEN_TTL_SEC;
  const token = await new SignJWT({ cid: customerId, kind: "qr" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(exp)
    .sign(getSecret());
  return { token, exp };
}

/**
 * Verify a Sync token and return its claims. Returns null on any
 * verification failure (expired, malformed, wrong issuer/audience,
 * wrong signature). Does not differentiate failure modes by design —
 * the caller cannot do anything with the discrimination, and exposing
 * "wrong signature" vs "expired" gives an attacker probe feedback.
 */
export async function verifyToken(
  token: string,
): Promise<SyncTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const cid = payload.cid;
    const kind = payload.kind;
    if (typeof cid !== "string" || (kind !== "access" && kind !== "qr")) {
      return null;
    }
    return {
      cid,
      kind,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * One-time exchange code minted on Stripe checkout success. Atelier
 * deep-links with this code immediately after checkout and trades it
 * for an access token via /api/sync/auth/exchange.
 *
 * Single-use: consumed atomically via Redis DEL on first use. A second
 * exchange attempt with the same code returns null.
 */
export async function issueExchangeCode(
  customerId: string,
): Promise<{ code: string; exp: number }> {
  const code = randomBytes(32).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + EXCHANGE_CODE_TTL_SEC;
  await redis().set(SYNC_KEY.exchangeCode(code), customerId, {
    ex: EXCHANGE_CODE_TTL_SEC,
  });
  return { code, exp };
}

/**
 * Atomic single-use consume: returns the customerId if the code was
 * valid and unused, null otherwise. The DEL after GET pattern is the
 * single-use enforcement; a concurrent second exchange will see the
 * key gone.
 */
export async function consumeExchangeCode(
  code: string,
): Promise<string | null> {
  const r = redis();
  const cid = await r.get<string>(SYNC_KEY.exchangeCode(code));
  if (!cid) return null;
  await r.del(SYNC_KEY.exchangeCode(code));
  return cid;
}

/**
 * Pull and verify a Bearer token from the request's Authorization
 * header. Returns the customer id on success, null otherwise. The
 * "kind" filter ensures a QR token is never accepted for a regular
 * data-plane call.
 */
export async function bearerCustomerId(
  request: Request,
  expectedKind: "access" | "qr" = "access",
): Promise<string | null> {
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const claims = await verifyToken(token);
  if (!claims) return null;
  if (claims.kind !== expectedKind) return null;
  return claims.cid;
}
