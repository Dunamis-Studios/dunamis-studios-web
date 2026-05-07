import { createHash } from "node:crypto";

/**
 * Stable hash for an email address, used as a Redis key segment.
 *
 * SHA-256 of the lowercased + trimmed email, hex-encoded, truncated
 * to 32 chars. The truncation is for terse keys; collisions on a
 * 128-bit prefix of SHA-256 are vanishingly unlikely at any realistic
 * customer count, and dedup correctness is bounded by the truncated
 * prefix being stable per email — which it is.
 *
 * The exact same algorithm is used by /api/notify and
 * /api/atelier-buy-request; pulled into a single helper here so the
 * licensing pipeline doesn't drift from the rest of the lead-capture
 * surface.
 */
export function hashEmail(email: string): string {
  return createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 32);
}
