/**
 * Stripe Checkout session creator for the three Sync SKUs. Auth via
 * cookie or Bearer JWT. The customer is expected to have signed in
 * to dunamisstudios.net before clicking Subscribe inside Atelier;
 * Atelier opens the URL in the default browser and the post-
 * checkout deep link returns the customer to the desktop.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, parseJson } from "@/lib/api";
import { getCurrentSessionAny } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { priceForLookupKey } from "@/lib/sync/stripe-helpers";
import { SYNC_LOOKUP_KEYS } from "@/lib/sync/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync/checkout
 *
 * Creates a Stripe Checkout session for one of the three Sync SKUs.
 * Authenticates via the existing dunamisstudios-site session cookie:
 * the customer has signed in to dunamisstudios.net before clicking
 * "Subscribe" from inside Atelier (Atelier opens the site URL in the
 * default browser; the customer authenticates there and lands on the
 * subscribe button).
 *
 * For monthly/annual the session is mode=subscription. For trial-month
 * it's mode=payment with a single one-time line item. The webhook
 * differentiates by lookup_key on the line items.
 *
 * Customer creation: customer_creation: "if_required" together with
 * customer_email lets Stripe reuse an existing customer for the email
 * if one exists, or create a new one. The webhook handler then writes
 * both forward and reverse account/customer indexes.
 */

const bodySchema = z.object({
  cadence: z.enum(["monthly", "annual", "trial_month"]),
  /** Optional override of the default success/cancel pages. */
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

export async function POST(request: Request) {
  // Cookie OR `Authorization: Bearer <jwt>` ingress. Atelier desktop
  // is signed in (Phase 2.1) and presents the JWT in the Bearer
  // header; the existing site flow continues to use the cookie.
  const session = await getCurrentSessionAny(request);
  if (!session) {
    return apiError(
      401,
      "unauthenticated",
      "Sign in to start a Sync subscription.",
    );
  }

  const parsed = await parseJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const cadence = parsed.data.cadence;
  const lookupKey = SYNC_LOOKUP_KEYS[cadence];
  const price = await priceForLookupKey(lookupKey);

  const appUrl = process.env.APP_URL ?? "https://www.dunamisstudios.net";
  const successUrl =
    parsed.data.success_url ??
    `${appUrl}/products/dunamis-sync/post-checkout?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    parsed.data.cancel_url ?? `${appUrl}/products/dunamis-sync`;

  const isOneTime = cadence === "trial_month";

  const stripeClient = stripe();
  const checkoutSession = await stripeClient.checkout.sessions.create({
    mode: isOneTime ? "payment" : "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: session.account.email,
    customer_creation: isOneTime ? "if_required" : undefined,
    // client_reference_id is the second-rail accountId binding. Even
    // if metadata gets stripped along some edge of the webhook
    // pipeline, the field on the Stripe Session itself carries the
    // accountId for the Phase 2.1 account-bound link.
    client_reference_id: session.account.accountId,
    allow_promotion_codes: true,
    automatic_tax: { enabled: false },
    metadata: {
      product: "dunamis-sync",
      cadence,
      lookup_key: lookupKey,
      dunamisAccountId: session.account.accountId,
    },
    subscription_data: isOneTime
      ? undefined
      : {
          metadata: {
            product: "dunamis-sync",
            cadence,
            lookup_key: lookupKey,
            dunamisAccountId: session.account.accountId,
          },
        },
    payment_intent_data: isOneTime
      ? {
          metadata: {
            product: "dunamis-sync",
            cadence,
            lookup_key: lookupKey,
            dunamisAccountId: session.account.accountId,
          },
        }
      : undefined,
  });

  return NextResponse.json({
    url: checkoutSession.url,
    session_id: checkoutSession.id,
  });
}
