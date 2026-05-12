import { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";
import { redis } from "./redis";
import { truncatedClientIp } from "./truncate-ip";

/**
 * Public-internet endpoints that Atelier desktops hit unauthenticated
 * (activation, heartbeat, EULA acceptance) get a sliding-window
 * rate limit keyed by the *truncated* client IP. Truncation matches
 * what we already log under truncateIp(), so the rate-limit key
 * cannot be used to fingerprint a specific subscriber.
 *
 * Each limiter is a Ratelimit instance scoped to its own Redis
 * key prefix. Limits are intentionally generous on the activation
 * and EULA paths (humans, not automation; a flurry of legitimate
 * retries from a CGNAT/captive-portal environment shouldn't trip
 * them) and tighter on heartbeat (one client should fire it about
 * once per day; bursts indicate a stuck loop or an abusive script).
 *
 * The factory caches limiter instances so a hot route doesn't pay
 * the constructor cost on every request. Construction in turn
 * lazily resolves the shared Redis client.
 */

const limiters = new Map<string, Ratelimit>();

interface LimiterSpec {
  limit: number;
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  prefix: string;
}

const SPECS: Record<
  "activation" | "heartbeat" | "eula" | "admin",
  LimiterSpec
> = {
  activation: { limit: 20, window: "10 m", prefix: "atelier:activate" },
  heartbeat: { limit: 30, window: "1 m", prefix: "atelier:heartbeat" },
  eula: { limit: 20, window: "10 m", prefix: "atelier:eula" },
  // Admin endpoints are authenticated and gated by ADMIN_EMAILS.
  // Keying on the admin's email rather than truncated IP avoids
  // collisions when multiple admins sit behind a shared NAT (office,
  // VPN, captive WiFi) and keeps the throttle a meaningful per-actor
  // dimension. 30/1m gives the customers search page room to fire on
  // every keystroke during legitimate triage without throttling.
  admin: { limit: 30, window: "1 m", prefix: "admin" },
};

export type LimiterName = keyof typeof SPECS;

function limiterFor(name: LimiterName): Ratelimit {
  const existing = limiters.get(name);
  if (existing) return existing;
  const spec = SPECS[name];
  const ratelimit = new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(spec.limit, spec.window),
    prefix: `dunamis:rl:${spec.prefix}`,
    analytics: false,
  });
  limiters.set(name, ratelimit);
  return ratelimit;
}

function bucketKey(request: Request): string {
  return truncatedClientIp(request) ?? "unknown";
}

const DISABLED =
  process.env.NODE_ENV === "test" ||
  process.env.RATE_LIMIT_DISABLED === "1";

interface RateLimitOk {
  ok: true;
  remaining: number;
  reset: number;
}
interface RateLimitBlocked {
  ok: false;
  response: NextResponse;
}
export type RateLimitResult = RateLimitOk | RateLimitBlocked;

/**
 * Run the named limiter against the request's truncated-IP bucket.
 * On success returns metadata (remaining + reset epoch ms); on block
 * returns a fully-formed 429 NextResponse the route can return
 * directly. Disabled in `test` env and when RATE_LIMIT_DISABLED=1 to
 * keep smoke scripts and integration tests from tripping the limiter.
 */
export async function rateLimit(
  request: Request,
  name: LimiterName,
): Promise<RateLimitResult> {
  if (DISABLED) {
    return { ok: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
  const key = bucketKey(request);
  const result = await limiterFor(name).limit(key);
  if (result.success) {
    return { ok: true, remaining: result.remaining, reset: result.reset };
  }
  const retrySec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  const body = {
    ok: false,
    error: "rate_limited",
    retry_after_seconds: retrySec,
  };
  const response = NextResponse.json(body, {
    status: 429,
    headers: {
      "retry-after": String(retrySec),
      "x-ratelimit-limit": String(result.limit),
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(Math.ceil(result.reset / 1000)),
    },
  });
  return { ok: false, response };
}

/**
 * Variant of `rateLimit` that buckets by an arbitrary string key
 * rather than the request's truncated IP. Used by admin routes
 * where the meaningful per-actor dimension is the admin's email
 * (pulled from the gated session), not the IP. Same disabled-in-test
 * behavior; same 429 response shape.
 */
export async function rateLimitBy(
  bucket: string,
  name: LimiterName,
): Promise<RateLimitResult> {
  if (DISABLED) {
    return { ok: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
  const safeBucket = bucket.trim().toLowerCase() || "unknown";
  const result = await limiterFor(name).limit(safeBucket);
  if (result.success) {
    return { ok: true, remaining: result.remaining, reset: result.reset };
  }
  const retrySec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  const body = {
    ok: false,
    error: "rate_limited",
    retry_after_seconds: retrySec,
  };
  const response = NextResponse.json(body, {
    status: 429,
    headers: {
      "retry-after": String(retrySec),
      "x-ratelimit-limit": String(result.limit),
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": String(Math.ceil(result.reset / 1000)),
    },
  });
  return { ok: false, response };
}
