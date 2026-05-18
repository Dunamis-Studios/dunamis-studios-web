/**
 * Atelier Stripe pricing helpers. References Stripe Prices by
 * `lookup_key` rather than hardcoded price IDs so the catalog can be
 * edited in the Stripe dashboard without a code change.
 *
 * Used by /api/atelier/checkout (mints the Checkout Session against
 * the canonical perpetual price) and by the webhook handler in
 * src/lib/stripe-webhook.ts (classifyAtelierPrice on the first line
 * item of checkout.session.completed). Atelier ships a single SKU at
 * launch; the constant + per-key cache is forward-compatible for a
 * future second tier or upgrade SKU.
 *
 * Per-invocation cache: Vercel lambdas reuse the cache within a single
 * cold-start. Across invocations the cache resets, so a Stripe-side
 * price edit propagates without a deploy.
 */
import type Stripe from "stripe";

import { stripe } from "./stripe";

/**
 * Stripe `lookup_key` for the perpetual Atelier license. The actual
 * price (currency, amount, product) lives in Stripe; we reference it
 * by lookup_key so the catalog can be edited without a code change.
 *
 * Mirror of `SYNC_LOOKUP_KEYS` for Sync. Atelier has a single SKU at
 * launch (one tier, one price); a future major or upsell would add a
 * second key here.
 */
export const ATELIER_LOOKUP_KEYS = {
  perpetual: "atelier_perpetual",
} as const;

export type AtelierLookupKey =
  (typeof ATELIER_LOOKUP_KEYS)[keyof typeof ATELIER_LOOKUP_KEYS];

const cache = new Map<AtelierLookupKey, Stripe.Price>();

/**
 * Resolve an Atelier lookup_key to a Stripe Price object. Cached per
 * Vercel lambda invocation. Throws when the key is missing in the
 * Stripe catalog (operator-visible failure, not a runtime branch).
 */
export async function atelierPriceForLookupKey(
  lookupKey: AtelierLookupKey,
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
      `Stripe price not found for Atelier lookup_key="${lookupKey}". The Atelier catalog is out of sync with the spec.`,
    );
  }
  cache.set(lookupKey, price);
  return price;
}

/**
 * Map a Stripe Price object back to its Atelier semantic. Used by the
 * webhook handler when classifying a `checkout.session.completed`
 * event before deciding to mint a license.
 */
export function classifyAtelierPrice(
  price: Stripe.Price,
): AtelierLookupKey | null {
  const key = price.lookup_key;
  if (key === ATELIER_LOOKUP_KEYS.perpetual) return key;
  return null;
}

/**
 * Pull the lookup_key off the first line item of a checkout session.
 * Atelier checkouts always have one line item (single SKU), matching
 * the Sync helper's shape.
 */
export async function atelierLookupKeyForSession(
  session: Stripe.Checkout.Session,
): Promise<AtelierLookupKey | null> {
  const items = await stripe().checkout.sessions.listLineItems(session.id, {
    limit: 1,
    expand: ["data.price"],
  });
  const price = items.data[0]?.price;
  if (!price) return null;
  return classifyAtelierPrice(price);
}
