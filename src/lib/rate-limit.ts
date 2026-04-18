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

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
