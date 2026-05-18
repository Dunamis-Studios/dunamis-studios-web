/**
 * Per-entitlement Redis lock used by the Stripe webhook handler to
 * serialize writes against the same entitlement record. Upstash Redis
 * REST has no BLPOP / BRPOP, so the implementation polls SETNX with a
 * short retry budget. Stripe normally delivers events sequentially per
 * object, so contention here is rare; the lock exists as a belt-and-
 * suspenders guard for the cases where Stripe retries an event that
 * overlaps a freshly-fired one (or for any future code path that
 * touches an entitlement outside the webhook).
 *
 * Related: src/lib/stripe-webhook.ts (sole caller),
 * src/lib/redis.ts (KEY.entitlementLock).
 */
import { redis, KEY } from "./redis";

const LOCK_TTL_SEC = 10;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 200;

/**
 * Serialize writes to a single entitlement. Used by the webhook handler
 * so two concurrent Stripe events (rare — Stripe delivers sequentially
 * per object by default, but belts-and-suspenders) can't race on the
 * same entitlement record.
 *
 * Upstash Redis REST has no blocking semantics, so we poll with a
 * short retry loop. If the lock can't be acquired within the retry
 * budget, the caller should return 5xx so Stripe re-delivers — don't
 * silently proceed.
 */
export async function withEntitlementLock<T>(
  product: string,
  portalId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const r = redis();
  const key = KEY.entitlementLock(product, portalId);

  for (let i = 0; i < MAX_RETRIES; i++) {
    const acquired = await r.set(key, "1", {
      ex: LOCK_TTL_SEC,
      nx: true,
    });
    if (acquired) {
      try {
        return await fn();
      } finally {
        await r.del(key);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
  throw new Error(
    `Could not acquire entitlement lock for ${product}:${portalId}`,
  );
}
