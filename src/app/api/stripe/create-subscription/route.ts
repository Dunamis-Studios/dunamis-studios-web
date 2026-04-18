import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { getCurrentSession } from "@/lib/session";
import {
  getEntitlement,
  setStripeCustomerId,
} from "@/lib/accounts";
import { getPriceId } from "@/lib/pricing";
import { portalIdSchema } from "@/lib/validation";
import type { EntitlementTier } from "@/lib/types";

const bodySchema = z.object({
  product: z.literal("debrief"),
  portalId: portalIdSchema,
  tier: z.enum(["starter", "pro", "enterprise"]),
});

export async function POST(req: Request) {
  const s = await getCurrentSession();
  if (!s) return apiError(401, "unauthenticated", "Please sign in.");

  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { product, portalId, tier } = parsed.data;

  // Verify the signed-in account owns this entitlement.
  const entitlement = await getEntitlement(product, portalId);
  if (!entitlement || entitlement.accountId !== s.account.accountId) {
    return apiError(404, "not_found", "Entitlement not found.");
  }

  // If the entitlement already has an active subscription, this flow is
  // wrong — the caller should POST /api/stripe/change-plan instead.
  if (
    entitlement.stripeSubscriptionId &&
    entitlement.status !== "canceled" &&
    entitlement.status !== "past_due"
  ) {
    return apiError(
      409,
      "already_subscribed",
      "Use /api/stripe/change-plan to modify an active subscription.",
    );
  }

  const api = stripe();

  // 1. Customer — reuse if already on the account, create otherwise.
  let customerId = s.account.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await api.customers.create({
      email: s.account.email,
      name: `${s.account.firstName} ${s.account.lastName}`.trim(),
      metadata: { dunamisAccountId: s.account.accountId },
    });
    customerId = customer.id;
    await setStripeCustomerId(s.account, customerId);
  }

  // 2. Subscription — default_incomplete so the PaymentIntent on the
  // first invoice carries a clientSecret for Elements to confirm.
  const priceId = getPriceId(tier as EntitlementTier);
  const subscription = await api.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
    metadata: {
      dunamisAccountId: s.account.accountId,
      product,
      portalId,
      tier,
    },
  });

  const invoice = subscription.latest_invoice;
  const paymentIntent =
    invoice && typeof invoice !== "string"
      ? (invoice as unknown as { payment_intent?: { client_secret?: string } })
          .payment_intent
      : null;
  const clientSecret = paymentIntent?.client_secret ?? null;

  if (!clientSecret) {
    return apiError(
      500,
      "missing_client_secret",
      "Stripe did not return a payment intent for this subscription.",
    );
  }

  return NextResponse.json({
    clientSecret,
    subscriptionId: subscription.id,
    customerId,
  });
}
