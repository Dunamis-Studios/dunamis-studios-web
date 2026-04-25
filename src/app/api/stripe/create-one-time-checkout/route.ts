import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { getCurrentSession } from "@/lib/session";
import {
  getEntitlement,
  saveEntitlement,
  linkStripeCustomerToAccount,
} from "@/lib/accounts";
import { getPropertyPulseLicensePriceId } from "@/lib/pricing";
import { portalIdSchema } from "@/lib/validation";

/**
 * Property Pulse one-time license checkout. PP is flat $49 per portal,
 * no tiers, no recurring billing — so instead of the Debrief SetupIntent
 * → subscription dance, we hand the user off to Stripe-hosted Checkout
 * and listen for checkout.session.completed on the webhook side.
 *
 * Entitlement-ownership guard: the portal must have an installed PP
 * entitlement (claimed or unclaimed) owned by this account before we'll
 * mint a session. Install-then-pay is the product flow.
 */
const bodySchema = z.object({
  product: z.literal("property-pulse"),
  portalId: portalIdSchema,
});

export async function POST(req: Request) {
  const s = await getCurrentSession();
  if (!s) return apiError(401, "unauthenticated", "Please sign in.");

  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { product, portalId } = parsed.data;

  const entitlement = await getEntitlement(product, portalId);
  if (!entitlement || entitlement.accountId !== s.account.accountId) {
    return apiError(404, "not_found", "Entitlement not found.");
  }
  if (entitlement.licenseStatus === "Paid") {
    return apiError(
      409,
      "already_paid",
      "This portal's Property Pulse license is already paid.",
    );
  }

  const api = stripe();

  // Reuse the entitlement's Customer if present; otherwise create and
  // persist. Mirrors the buy-credits flow so a user who later buys
  // something else on this portal reuses one Customer per entitlement.
  let customerId = entitlement.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await api.customers.create({
      email: s.account.email,
      name: `${s.account.firstName} ${s.account.lastName}`.trim(),
      metadata: {
        dunamisAccountId: s.account.accountId,
        product,
        portalId,
      },
    });
    customerId = customer.id;
    entitlement.stripeCustomerId = customerId;
    await saveEntitlement(entitlement);
    await linkStripeCustomerToAccount(s.account.accountId, customerId);
  }

  const siteUrl =
    process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";
  const returnPath = `/account/${product}/${portalId}`;

  const session = await api.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: getPropertyPulseLicensePriceId(), quantity: 1 }],
    // Duplicated metadata: checkout.session.completed reads session.metadata;
    // the underlying PaymentIntent inherits payment_intent_data.metadata,
    // which is what the refund path (resolveRefundedChargeOrigin Path A)
    // reads months later when a charge.refunded fires.
    metadata: {
      dunamisAccountId: s.account.accountId,
      product,
      portalId,
    },
    payment_intent_data: {
      metadata: {
        dunamisAccountId: s.account.accountId,
        product,
        portalId,
      },
    },
    success_url: `${siteUrl}${returnPath}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${returnPath}?purchase=cancelled`,
  });

  if (!session.url) {
    return apiError(
      500,
      "missing_session_url",
      "Stripe did not return a checkout session URL.",
    );
  }

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
