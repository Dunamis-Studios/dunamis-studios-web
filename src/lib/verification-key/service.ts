import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verification key service.
 *
 * Generates and validates the short-lived HMAC-derived "verification
 * key" that customers paste into the support form's verification
 * field to prove they control the email they put in the form. Two
 * paths produce a valid key:
 *
 *   (a) Authenticated customer with at least one active Atelier
 *       license can request a key for their own account email; the
 *       `/api/support/verification-key/account` endpoint returns it
 *       inline so the widget can show it without an email round-trip.
 *   (b) Anyone can ask the system to email a key to an arbitrary
 *       address via `/api/support/verification-key/email`; whoever
 *       controls that inbox sees the key and can paste it back.
 *
 * The key itself is derived deterministically from
 * `HMAC-SHA256(secret, "${email.toLowerCase()}:${window}")`, where
 * `window` is the 30-minute UTC bucket the current time falls into.
 * The first 32 hex chars of that HMAC are sliced into UUID shape
 * (8-4-4-4-12) so the key looks like a familiar opaque identifier
 * to a copy/paste user but is fully derivable from the inputs.
 *
 * Validation re-derives the key for the current window plus the
 * window on either side (so a customer who generated a key at the
 * 29th minute can still submit at the 31st without re-issuing). The
 * comparison uses timingSafeEqual to keep the equality check from
 * leaking secret-bit information through wall-clock timing.
 *
 * VERIFICATION_KEY_SECRET must be set in env; missing secret throws
 * at first use (fail fast).
 */

const WINDOW_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function getSecret(): string {
  const raw = process.env.VERIFICATION_KEY_SECRET;
  if (!raw) {
    throw new Error(
      "VERIFICATION_KEY_SECRET is not set. Provision it in Vercel before the support flow can issue or verify keys.",
    );
  }
  return raw;
}

export function getCurrentWindow(): number {
  return Math.floor(Date.now() / WINDOW_DURATION_MS);
}

/**
 * Window start instant in epoch ms. Used for `generated_at` (window
 * start) and `expires_at` (window start + WINDOW_DURATION_MS) on the
 * issue-side endpoints so the client knows when to offer a regenerate.
 */
export function windowStartMs(window: number): number {
  return window * WINDOW_DURATION_MS;
}

export const WINDOW_MS = WINDOW_DURATION_MS;

export function deriveKey(email: string, window: number): string {
  const normalized = email.trim().toLowerCase();
  const mac = createHmac("sha256", getSecret())
    .update(`${normalized}:${window}`)
    .digest("hex");
  // First 32 hex chars sliced UUID-style. 32 hex chars = 128 bits of
  // HMAC output, well above the brute-force budget for a 30-minute
  // window protected by a rate limit at the submit endpoint.
  const head = mac.slice(0, 32);
  return [
    head.slice(0, 8),
    head.slice(8, 12),
    head.slice(12, 16),
    head.slice(16, 20),
    head.slice(20, 32),
  ].join("-");
}

export interface VerifyKeyResult {
  matches: boolean;
  matchedWindow: number | null;
}

export function verifyKey(
  submittedEmail: string,
  submittedKey: string,
  toleranceWindows = 1,
): VerifyKeyResult {
  const trimmed = (submittedKey ?? "").trim();
  if (trimmed.length === 0) return { matches: false, matchedWindow: null };
  const submittedBytes = Buffer.from(trimmed);
  const now = getCurrentWindow();
  for (let offset = 0; offset <= toleranceWindows; offset++) {
    for (const candidate of offset === 0
      ? [now]
      : [now - offset, now + offset]) {
      const expected = deriveKey(submittedEmail, candidate);
      const expectedBytes = Buffer.from(expected);
      if (expectedBytes.length !== submittedBytes.length) continue;
      if (timingSafeEqual(submittedBytes, expectedBytes)) {
        return { matches: true, matchedWindow: candidate };
      }
    }
  }
  return { matches: false, matchedWindow: null };
}

/**
 * Re-derive the key that would have been issued for an arbitrary
 * window. Used by the admin Verification Keys section to compute the
 * expected key for a ticket given the ticket's creation timestamp,
 * then compare against the stored `identity_verification_reference`
 * with the same +/- 1 window tolerance the submit path uses.
 */
export function verifyKeyForTimestamp(
  email: string,
  submittedKey: string,
  timestampMs: number,
  toleranceWindows = 1,
): VerifyKeyResult {
  const trimmed = (submittedKey ?? "").trim();
  if (trimmed.length === 0) return { matches: false, matchedWindow: null };
  const submittedBytes = Buffer.from(trimmed);
  const center = Math.floor(timestampMs / WINDOW_DURATION_MS);
  for (let offset = 0; offset <= toleranceWindows; offset++) {
    for (const candidate of offset === 0
      ? [center]
      : [center - offset, center + offset]) {
      const expected = deriveKey(email, candidate);
      const expectedBytes = Buffer.from(expected);
      if (expectedBytes.length !== submittedBytes.length) continue;
      if (timingSafeEqual(submittedBytes, expectedBytes)) {
        return { matches: true, matchedWindow: candidate };
      }
    }
  }
  return { matches: false, matchedWindow: null };
}

/**
 * UUID-shaped key pattern for Zod / route-layer shape validation
 * before we even bother re-deriving. Matches 8-4-4-4-12 lowercase hex,
 * which is what `deriveKey()` always emits.
 */
export const KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
