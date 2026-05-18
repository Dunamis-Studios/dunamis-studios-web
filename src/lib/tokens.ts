/**
 * JWT signing / verification and random-token generation for the
 * account session layer.
 *
 * Sessions are stored server-side in Redis (see src/lib/session.ts);
 * the JWT carried in the cookie / Authorization header is a thin
 * envelope that binds a session id (`sid`) plus an expiration. Server
 * routes verify the JWT, then look up the canonical session record by
 * sid. That way a session can be invalidated server-side (logout,
 * password change, account delete) without waiting for the JWT to
 * expire.
 *
 * Issuer + audience are pinned so a token minted for some other
 * purpose, even with the same secret, never satisfies a session
 * verification.
 */
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

/**
 * Resolve the JWT secret from env. Encoded once into a Uint8Array so
 * the jose helpers don't pay the TextEncoder cost per call. Throws if
 * the secret is missing or under the 32-character HS256 floor: a weak
 * secret silently downgrades the whole session layer's security, so
 * we surface the misconfiguration loudly rather than letting it boot.
 */
function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters.");
  }
  return encoder.encode(s);
}

/**
 * Mint a session JWT that binds the caller-supplied session id and
 * expires after `lifetimeSec` seconds.
 *
 * The session id is the load-bearing identifier; the JWT itself is
 * the transport envelope. Issuer ("dunamis-studios") and audience
 * ("dunamis-session") are pinned so a JWT minted for any other
 * purpose, even sharing the secret, can't satisfy a session verify.
 *
 * @param sessionId - Opaque server-side session id (Redis key value).
 * @param lifetimeSec - Lifetime in seconds. Should match the Redis
 *                       session TTL so the two expire together.
 * @returns The compact-serialized JWT suitable for a cookie or
 *          Authorization header.
 */
export async function signSessionJwt(
  sessionId: string,
  lifetimeSec: number,
): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("dunamis-studios")
    .setAudience("dunamis-session")
    .setExpirationTime(Math.floor(Date.now() / 1000) + lifetimeSec)
    .sign(secret());
}

/**
 * Verify a session JWT and extract the session id payload.
 *
 * Returns null for any failure mode (expired, wrong signature, wrong
 * issuer or audience, missing `sid` claim, non-string `sid` claim).
 * Routes treat null as "not authenticated" and never differentiate
 * the failure reason in the response so a probe can't distinguish
 * expired tokens from forged ones.
 *
 * @param token - The JWT string from the cookie / Authorization header.
 * @returns An object containing the session id, or null on any
 *          verification failure.
 */
export async function verifySessionJwt(
  token: string,
): Promise<{ sid: string } | null> {
  // Step 1: structural + signature verification.
  // jose's jwtVerify enforces signature, exp, iss, aud, and shape;
  // any failure throws, which the try/catch flattens to null.
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "dunamis-studios",
      audience: "dunamis-session",
    });

    // Step 2: payload shape guard.
    // We require the `sid` claim explicitly so a JWT that passed
    // signature checks but lacks the expected payload still gets
    // rejected as null.
    if (typeof payload.sid !== "string") return null;

    return { sid: payload.sid };
  } catch {
    return null;
  }
}

/**
 * Generate a cryptographically random URL-safe token.
 *
 * Used for one-time tokens that live in Redis (email-verify, password
 * reset, claim-state). Base64-URL encoded (no `+`, `/`, or `=`) so the
 * result drops cleanly into URL query strings without further
 * encoding.
 *
 * @param bytes - Number of random bytes to draw. Default 32 yields a
 *                 ~43-character token, ~256 bits of entropy.
 * @returns A URL-safe random string.
 */
export function randomToken(bytes = 32): string {
  // Step 1: fill a buffer with CSPRNG bytes.
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);

  // Step 2: base64 then patch the URL-unsafe characters.
  // `+`, `/`, and `=` are URL-reserved per RFC 4648 §5; replacing them
  // produces base64url without needing a dedicated encoder.
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Thin wrapper around the runtime's crypto.randomUUID(). Centralized
 * so callers don't sprinkle direct crypto references through the
 * codebase and so we can swap the implementation if we ever need to
 * (e.g., to use a deterministic UUID in test contexts).
 *
 * @returns A v4 UUID string.
 */
export function uuid(): string {
  return crypto.randomUUID();
}
