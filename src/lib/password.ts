import bcrypt from "bcryptjs";

const COST = 12;
const MAX_BCRYPT_BYTES = 72;

export async function hashPassword(plain: string): Promise<string> {
  if (Buffer.byteLength(plain, "utf8") > MAX_BCRYPT_BYTES) {
    throw new Error("Password exceeds 72-byte bcrypt limit.");
  }
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (Buffer.byteLength(plain, "utf8") > MAX_BCRYPT_BYTES) return false;
  return bcrypt.compare(plain, hash);
}

/** Constraints per spec: ≥8 chars, at least one digit or symbol. */
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[\d\W_]/.test(pw)) {
    return "Password must contain a number or symbol.";
  }
  if (Buffer.byteLength(pw, "utf8") > MAX_BCRYPT_BYTES) {
    return "Password is too long (max 72 bytes).";
  }
  return null;
}
