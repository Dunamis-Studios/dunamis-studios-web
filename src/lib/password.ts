/**
 * Password hashing and validation helpers used by the account auth
 * routes (/api/auth/signup, /api/auth/login, /api/auth/change-password).
 *
 * Backed by bcryptjs (pure-JS, no native module needed on Vercel
 * serverless). Cost factor 12 is a balance between brute-force
 * resistance and the per-login latency we can absorb on a cold start.
 *
 * Critical safety guard: bcrypt silently truncates input past 72 bytes
 * to 72 bytes, which would let a 200-character password validate
 * against any other password sharing the same first 72 bytes. Every
 * entry point in this file explicitly enforces the 72-byte cap so a
 * silent truncation never reaches the hash function.
 */
import bcrypt from "bcryptjs";

/** bcrypt work factor. ~250 ms / hash on Vercel's Lambda runtime. */
const COST = 12;
/** bcrypt's hard input limit. Inputs past this are silently truncated. */
const MAX_BCRYPT_BYTES = 72;

/**
 * Hash a plaintext password for storage on the account record.
 *
 * Rejects inputs that exceed bcrypt's 72-byte input limit instead of
 * letting bcrypt silently truncate, which would weaken the resulting
 * hash. Callers receive the rejection as a thrown Error; the auth
 * routes translate it into a 400 with the same constraint the
 * validatePassword helper would return.
 *
 * @param plain - Raw user-supplied password (UTF-8 byte length capped
 *                at 72 by the caller's validation but re-checked here).
 * @returns A bcrypt hash string suitable for storage on the account
 *          record.
 * @throws When the input exceeds 72 UTF-8 bytes.
 */
export async function hashPassword(plain: string): Promise<string> {
  if (Buffer.byteLength(plain, "utf8") > MAX_BCRYPT_BYTES) {
    throw new Error("Password exceeds 72-byte bcrypt limit.");
  }
  return bcrypt.hash(plain, COST);
}

/**
 * Constant-time compare a plaintext password against a stored bcrypt
 * hash.
 *
 * Returns false on inputs that exceed the 72-byte cap so a malicious
 * caller cannot brute-force a long-password collision against a
 * stored hash whose original input was also over 72 bytes (the
 * pre-cap from hashPassword above prevents that case from existing,
 * but this is belt-and-suspenders).
 *
 * @param plain - The candidate password supplied by the user.
 * @param hash - The stored bcrypt hash from the account record.
 * @returns true when the plaintext matches, false otherwise.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (Buffer.byteLength(plain, "utf8") > MAX_BCRYPT_BYTES) return false;
  return bcrypt.compare(plain, hash);
}

/**
 * Validate a candidate password against the site's policy. Constraints
 * per spec: at least 8 characters, at least one digit or symbol, and
 * fits within bcrypt's 72-byte input limit.
 *
 * Used by the auth routes to surface a friendly error message in the
 * 400 response before the hash step. Returns null when the password
 * passes, or a short human-readable message when it fails. Returning a
 * string (rather than throwing) lets the auth route attach the message
 * to the `fields.password` slot of the validation_error envelope.
 *
 * @param pw - Raw user-supplied password.
 * @returns null when valid, otherwise a constraint-specific message.
 */
export function validatePassword(pw: string): string | null {
  // Step 1: minimum length.
  if (pw.length < 8) return "Password must be at least 8 characters.";

  // Step 2: digit or symbol requirement.
  // \W matches non-word characters and _ is added explicitly so that
  // underscore counts as a symbol too.
  if (!/[\d\W_]/.test(pw)) {
    return "Password must contain a number or symbol.";
  }

  // Step 3: bcrypt input cap.
  // Measured in UTF-8 bytes, not character length, because bcrypt's
  // truncation is byte-based and a multibyte character can blow the
  // limit much earlier than character count suggests.
  if (Buffer.byteLength(pw, "utf8") > MAX_BCRYPT_BYTES) {
    return "Password is too long (max 72 bytes).";
  }

  return null;
}
