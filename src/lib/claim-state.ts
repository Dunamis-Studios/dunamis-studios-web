import crypto from "crypto";

/**
 * claim-state.ts — verify the HMAC-signed state token Debrief passes
 * to this site on the HubSpot-install → Dunamis-signup handoff.
 *
 * WIRE FORMAT
 * `${base64url(payloadJson)}.${base64url(hmacSha256(payloadJson))}`
 *
 * Payload JSON shape:
 *   { portalId: string, installerEmail: string, issuedAt: ISO, version: 1 }
 *
 * Must stay byte-for-byte compatible with the Debrief server's
 * server/lib/claim-state.js. A drift on either side breaks every
 * in-flight install handoff.
 *
 * SECURITY
 * - HMAC-SHA256 via node:crypto, shared secret CLAIM_STATE_SECRET.
 * - 15-minute TTL from issuedAt. Captured tokens have a short reuse
 *   window.
 * - Constant-time signature comparison.
 * - Returns null on any verification failure (shape, signature,
 *   expiry). Callers distinguish "valid payload" from "null = reject
 *   the link" without needing to inspect the error class.
 */

const TOKEN_VERSION = 1;
const TTL_MS = 15 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

function getSecret(): string {
  const s = process.env.CLAIM_STATE_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "CLAIM_STATE_SECRET must be set and at least 32 chars. Generate with: openssl rand -hex 32",
    );
  }
  return s;
}

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function hmacSign(payloadBuf: Buffer): Buffer {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payloadBuf)
    .digest();
}

export interface ClaimStatePayload {
  portalId: string;
  installerEmail: string;
  issuedAt: string;
  version: number;
}

/**
 * Sign a claim-state token. Dunamis doesn't currently issue these
 * (Debrief does), but exporting sign alongside verify keeps the
 * symmetry and gives us a test seam + a future surface if Dunamis
 * ever needs to re-issue a claim link from a support tool.
 */
export function signClaimState(input: {
  portalId: string;
  installerEmail: string;
}): string {
  if (!input.portalId) {
    throw new Error("signClaimState: portalId required");
  }
  if (!input.installerEmail) {
    throw new Error("signClaimState: installerEmail required");
  }
  const payload: ClaimStatePayload = {
    portalId: input.portalId,
    installerEmail: input.installerEmail.toLowerCase(),
    issuedAt: new Date().toISOString(),
    version: TOKEN_VERSION,
  };
  const payloadBuf = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = hmacSign(payloadBuf);
  return `${base64urlEncode(payloadBuf)}.${base64urlEncode(sig)}`;
}

/**
 * Verify a claim-state token. Returns the parsed payload if the
 * signature is valid and the token is within the 15-minute TTL.
 * Returns null on ANY failure (malformed, bad signature, expired,
 * wrong version). Callers should treat null as "show the generic
 * expired/invalid error and send the user back to HubSpot to
 * reinstall."
 *
 * On failure, we console.error a tagged diagnostic so server logs
 * reveal *which* of the ~dozen failure modes fired. The HTTP
 * response stays generic — we don't leak internals to the browser
 * — but the operator reading Vercel logs can tell a
 * signature_mismatch from a token_expired without guessing.
 */
export function verifyClaimState(
  token: string | null | undefined,
): ClaimStatePayload | null {
  if (!token || typeof token !== "string") {
    console.error("[claim-state] verification failed:", {
      reason: "missing_state",
    });
    return null;
  }

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) {
    console.error("[claim-state] verification failed:", {
      reason: "malformed_token",
    });
    return null;
  }
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  let payloadBuf: Buffer;
  let providedSig: Buffer;
  try {
    payloadBuf = base64urlDecode(payloadB64);
    providedSig = base64urlDecode(sigB64);
  } catch {
    console.error("[claim-state] verification failed:", {
      reason: "base64_decode_failed",
    });
    return null;
  }

  let expectedSig: Buffer;
  try {
    expectedSig = hmacSign(payloadBuf);
  } catch {
    // Secret missing or too short — can't even compute an expected
    // signature. Report as signature_mismatch; the secret-length
    // diagnostic below disambiguates (length 0 → env var absent).
    logSignatureMismatch();
    return null;
  }

  if (
    providedSig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(providedSig, expectedSig)
  ) {
    logSignatureMismatch();
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadBuf.toString("utf8"));
  } catch {
    console.error("[claim-state] verification failed:", {
      reason: "payload_not_json",
    });
    return null;
  }

  if (!payload || typeof payload !== "object") {
    console.error("[claim-state] verification failed:", {
      reason: "payload_not_json",
      detail: "parsed but not an object",
    });
    return null;
  }
  const p = payload as Record<string, unknown>;
  if (p.version !== TOKEN_VERSION) {
    console.error("[claim-state] verification failed:", {
      reason: "version_mismatch",
      got: p.version,
      expected: TOKEN_VERSION,
    });
    return null;
  }
  if (typeof p.portalId !== "string" || !p.portalId) {
    console.error("[claim-state] verification failed:", {
      reason: "missing_portal_id",
    });
    return null;
  }
  if (typeof p.installerEmail !== "string" || !p.installerEmail) {
    console.error("[claim-state] verification failed:", {
      reason: "missing_installer_email",
    });
    return null;
  }
  if (typeof p.issuedAt !== "string") {
    console.error("[claim-state] verification failed:", {
      reason: "missing_issued_at",
    });
    return null;
  }

  const issuedMs = Date.parse(p.issuedAt);
  if (!Number.isFinite(issuedMs)) {
    // Field is present but not a parseable ISO timestamp — same
    // operational bucket as missing, diagnosed by the issuedAt echo.
    console.error("[claim-state] verification failed:", {
      reason: "missing_issued_at",
      issuedAt: p.issuedAt,
    });
    return null;
  }
  const now = Date.now();
  if (now - issuedMs > TTL_MS) {
    console.error("[claim-state] verification failed:", {
      reason: "token_expired",
      ageMs: now - issuedMs,
      ttlMs: TTL_MS,
    });
    return null;
  }
  if (issuedMs - now > CLOCK_SKEW_MS) {
    console.error("[claim-state] verification failed:", {
      reason: "clock_skew",
      futureMs: issuedMs - now,
      skewMs: CLOCK_SKEW_MS,
    });
    return null;
  }

  return {
    portalId: p.portalId,
    installerEmail: p.installerEmail,
    issuedAt: p.issuedAt,
    version: TOKEN_VERSION,
  };
}

function logSignatureMismatch(): void {
  console.error("[claim-state] verification failed:", {
    reason: "signature_mismatch",
  });
  console.error(
    "[claim-state] signature mismatch, secret length:",
    process.env.CLAIM_STATE_SECRET?.length ?? 0,
  );
}

export { TOKEN_VERSION, TTL_MS };
