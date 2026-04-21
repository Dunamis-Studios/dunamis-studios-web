import { redis, KEY } from "./redis";

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetInSec: number;
}

/**
 * Fixed-window rate limiter. Bucket is a string like "login", key is an
 * identifier like IP or email. Returns ok:false once count exceeds `limit`
 * within `windowSec` seconds.
 */
export async function rateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const r = redis();
  const k = KEY.rate(bucket, key);
  const count = await r.incr(k);
  if (count === 1) {
    await r.expire(k, windowSec);
  }
  const ttl = await r.ttl(k);
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetInSec: ttl > 0 ? ttl : windowSec,
  };
}

/**
 * Extract the real client IP from request headers.
 *
 * Order:
 *  1. `x-real-ip` -- platform-set on Vercel's edge and NOT client-controllable.
 *     This is the canonical value when running behind Vercel.
 *  2. `x-forwarded-for` -- take the LAST entry. Vercel appends the true
 *     client IP to any client-supplied XFF header, so the last entry is the
 *     one the platform trusts. Taking the first entry (the old behavior)
 *     means trusting attacker input: a request with
 *     `X-Forwarded-For: 1.2.3.4` lands in that IP's rate-limit bucket
 *     regardless of the real sender, letting brute-force / vote-stuffing
 *     attackers trivially bypass IP-keyed limits by rotating values.
 *
 * Each candidate is shape-validated as IPv4 or IPv6 before use; malformed
 * values fall through to the next source. Returns "unknown" if no header
 * produced a valid IP.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) {
    const trimmed = real.trim();
    if (isValidIp(trimmed)) return trimmed;
  }
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && isValidIp(last)) return last;
  }
  return "unknown";
}

/**
 * Loose IP shape check. Goal is to reject obvious injected garbage
 * (SQL fragments, huge strings, HTML) without trying to fully RFC-validate;
 * rate-limit bucket keying only needs "plausible IP" confidence.
 */
function isValidIp(s: string): boolean {
  if (s.length === 0 || s.length > 45) return false;
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(s)) {
    return s.split(".").every((o) => {
      const n = Number(o);
      return n >= 0 && n <= 255;
    });
  }
  return /^[0-9a-fA-F:.]+$/.test(s) && s.includes(":");
}
