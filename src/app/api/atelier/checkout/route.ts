import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, parseJson } from "@/lib/api";
import { atelierPriceForLookupKey, ATELIER_LOOKUP_KEYS } from "@/lib/atelier-pricing";
import { getCurrentSessionAny } from "@/lib/session";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/atelier/checkout
 *
 * Creates a Stripe Checkout session for the perpetual Atelier license
 * ($149, one-time). Mirror of /api/sync/checkout, scaled down to a
 * single SKU. Auth via cookie OR `Authorization: Bearer <jwt>`; Atelier
 * desktop hits this with the bearer it received from /api/auth/login.
 *
 * The post-purchase flow:
 *   1. Customer pays in Stripe → checkout.session.completed webhook.
 *   2. Webhook handler (stripe-webhook.ts) mints an Ed25519-signed
 *      license via signAndPersistLicense, indexed under the customer
 *      account, and fires the license email.
 *   3. Stripe redirects to success_url, the website page deep-links
 *      `atelier://atelier/post-checkout?session_id=…` into the desktop.
 *   4. The desktop deep-link handler re-fetches entitlements (sees
 *      the new license) and runs the existing account_auto_activate
 *      path against /api/atelier/activate — same 3-device cap +
 *      2-of-3 hardware match as the manual activation flow.
 *
 * Atelier-side activation slot accounting is unchanged by this route.
 * This endpoint only mints the Stripe Checkout session; license
 * existence + slot enforcement live elsewhere.
 */

const bodySchema = z.object({
  /** Optional override of the default success/cancel pages. */
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

export async function POST(request: Request) {
  const session = await getCurrentSessionAny(request);
  if (!session) {
    return apiError(
      401,
      "unauthenticated",
      "Sign in to purchase Atelier.",
    );
  }

  const parsed = await parseJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const price = await atelierPriceForLookupKey(ATELIER_LOOKUP_KEYS.perpetual);

  const appUrl = process.env.APP_URL ?? "https://www.dunamisstudios.net";
  const successUrl =
    parsed.data.success_url ??
    `${appUrl}/build-services/products/atelier/post-checkout?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    parsed.data.cancel_url ?? `${appUrl}/marketplace/atelier`;

  const stripeClient = stripe();
  const checkoutSession = await stripeClient.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: session.account.email,
    customer_creation: "if_required",
    // The webhook reads metadata.product to discriminate Atelier from
    // Sync / Property Pulse / credit-pack one-time charges. The
    // dunamisAccountId is duplicated on client_reference_id so the
    // account binding survives even if metadata is stripped along
    // some edge of the webhook pipeline.
    client_reference_id: session.account.accountId,
    allow_promotion_codes: true,
    automatic_tax: { enabled: false },
    metadata: {
      product: "atelier",
      lookup_key: ATELIER_LOOKUP_KEYS.perpetual,
      dunamisAccountId: session.account.accountId,
    },
    payment_intent_data: {
      metadata: {
        product: "atelier",
        lookup_key: ATELIER_LOOKUP_KEYS.perpetual,
        dunamisAccountId: session.account.accountId,
      },
    },
  });

  return NextResponse.json({
    url: checkoutSession.url,
    session_id: checkoutSession.id,
  });
}
