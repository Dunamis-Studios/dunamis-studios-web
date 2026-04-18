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
