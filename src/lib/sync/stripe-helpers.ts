import type Stripe from "stripe";

import { stripe } from "../stripe";
import { SYNC_LOOKUP_KEYS, type SyncLookupKey } from "./types";

/**
 * Resolve a Sync lookup_key to a Stripe Price object. Cached per
 * Node lambda invocation lifetime — Vercel functions are short-lived,
 * so a per-invocation cache is sufficient and avoids Redis chatter on
 * the checkout hot path.
 *
 * Throws if the lookup key is unknown to Stripe (which means the
 * test/live catalog drifted from the spec — operator alert, not a
 * runtime branch the client should observe).
 */
const cache = new Map<SyncLookupKey, Stripe.Price>();

export async function priceForLookupKey(
  lookupKey: SyncLookupKey,
): Promise<Stripe.Price> {
  const cached = cache.get(lookupKey);
  if (cached) return cached;

  const list = await stripe().prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  const price = list.data[0];
  if (!price) {
    throw new Error(
      `Stripe price not found for lookup_key="${lookupKey}". The Sync catalog is out of sync with the spec.`,
    );
  }
  cache.set(lookupKey, price);
  return price;
}

/**
 * Map a Stripe Price object back to its Sync semantic. Used by the
 * webhook handler to discriminate which checkout path was completed.
 */
export function classifyPrice(price: Stripe.Price): SyncLookupKey | null {
  const key = price.lookup_key;
  if (
    key === SYNC_LOOKUP_KEYS.monthly ||
    key === SYNC_LOOKUP_KEYS.annual ||
    key === SYNC_LOOKUP_KEYS.trial_month
  ) {
    return key;
  }
  return null;
}

/**
 * Pull the lookup key off a checkout session's first line item.
 * Stripe checkout sessions for Sync only ever have one line item
 * (single product, single price), so the array shape is constrained.
 */
export async function lookupKeyForSession(
  session: Stripe.Checkout.Session,
): Promise<SyncLookupKey | null> {
  const items = await stripe().checkout.sessions.listLineItems(session.id, {
    limit: 1,
    expand: ["data.price"],
  });
  const price = items.data[0]?.price;
  if (!price) return null;
  return classifyPrice(price);
}

/**
 * Pull the lookup key off a subscription's first item.price.
 */
export function lookupKeyForSubscription(
  sub: Stripe.Subscription,
): SyncLookupKey | null {
  const price = sub.items.data[0]?.price;
  if (!price) return null;
  return classifyPrice(price);
}
