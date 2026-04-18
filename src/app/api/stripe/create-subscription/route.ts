import { NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { apiError, parseJson } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { getCurrentSession } from "@/lib/session";
import { getEntitlement } from "@/lib/accounts";
import { getPriceId } from "@/lib/pricing";
import { portalIdSchema } from "@/lib/validation";
import type { EntitlementTier } from "@/lib/types";

const bodySchema = z.object({
  product: z.literal("debrief"),
  portalId: portalIdSchema,
  tier: z.enum(["starter", "pro", "enterprise"]),
  setupIntentId: z.string().min(1).max(200),
});

/**
 * Step 2 of the SetupIntent-first subscribe flow.
 *
 * Consumes the SetupIntent produced by /api/stripe/create-setup-intent
 * (its payment_method must already be attached to the entitlement's
 * customer), then creates the subscription with that payment method
 * set as default. `payment_behavior: 'error_if_incomplete'` forces
 * Stripe to attempt immediate payment — on success the subscription
 * lands active and the customer.subscription.created webhook handles
 * the Redis writes. On card decline, Stripe throws and we surface a
 * clean error. On 3DS requirement we return { requires3DS, clientSecret,
 * subscriptionId } for the frontend to complete via confirmCardPayment.
 */
export async function POST(req: Request) {
  const s = await getCurrentSession();
  if (!s) return apiError(401, "unauthenticated", "Please sign in.");

  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { product, portalId, tier, setupIntentId } = parsed.data;

  const entitlement = await getEntitlement(product, portalId);
  if (!entitlement) {
    return apiError(404, "not_found", "Entitlement not found.");
  }
  if (entitlement.accountId !== s.account.accountId) {
    return apiError(
      403,
      "forbidden",
      "You don't have access to this entitlement.",
    );
  }
  if (!entitlement.stripeCustomerId) {
    return apiError(
      400,
      "missing_customer",
      "No Stripe customer associated with this entitlement yet. Create a SetupIntent first.",
    );
  }
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

  // 1. Validate the SetupIntent belongs to the right customer and is ready.
  let setupIntent: Stripe.SetupIntent;
  try {
    setupIntent = await api.setupIntents.retrieve(setupIntentId);
  } catch (err) {
    return apiError(400, "invalid_setup_intent", stripeMessage(err));
  }

  const siCustomerId =
    typeof setupIntent.customer === "string"
      ? setupIntent.customer
      : (setupIntent.customer?.id ?? null);
  if (siCustomerId !== entitlement.stripeCustomerId) {
    return apiError(
      400,
      "setup_intent_mismatch",
      "SetupIntent doesn't belong to this entitlement's customer.",
    );
  }
  if (setupIntent.status !== "succeeded") {
    return apiError(
      400,
      "setup_intent_not_ready",
      `SetupIntent status is '${setupIntent.status}', expected 'succeeded'.`,
    );
  }

  const paymentMethod =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : (setupIntent.payment_method?.id ?? null);
  if (!paymentMethod) {
    return apiError(
      400,
      "no_payment_method",
      "SetupIntent has no payment method attached.",
    );
  }

  // 2. Create the subscription with the attached payment method. Fail
  // fast if the first charge can't complete (card decline, funds, etc.).
  const priceId = getPriceId(tier as EntitlementTier);
  try {
    const subscription = await api.subscriptions.create({
      customer: entitlement.stripeCustomerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethod,
      collection_method: "charge_automatically",
      payment_behavior: "error_if_incomplete",
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        dunamisAccountId: s.account.accountId,
        product,
        portalId,
        tier,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (err) {
    // 3DS path — Stripe returns a StripeCardError with
    // code='authentication_required'. The subscription has been created
    // in status=incomplete; the latest invoice carries a PaymentIntent
    // whose client_secret we hand back for the frontend to confirm.
    if (isAuthRequired(err)) {
      const recovered = await recoverAuthRequiredSubscription(err, api);
      if (recovered.subscriptionId && recovered.clientSecret) {
        return NextResponse.json({
          requires3DS: true,
          subscriptionId: recovered.subscriptionId,
          clientSecret: recovered.clientSecret,
        });
      }
      // If we can't recover the PI for 3DS, fall through to a generic
      // error — the subscription will get canceled by the cleanup
      // script on the next sweep.
    }
    return apiError(400, "subscription_failed", stripeMessage(err));
  }
}

function stripeMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Stripe error.";
}

function isAuthRequired(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  const rawCode = (err as { raw?: { code?: unknown } }).raw?.code;
  const declineCode = (err as { decline_code?: unknown }).decline_code;
  return (
    code === "authentication_required" ||
    rawCode === "authentication_required" ||
    declineCode === "authentication_required"
  );
}

async function recoverAuthRequiredSubscription(
  err: unknown,
  api: ReturnType<typeof stripe>,
): Promise<{ subscriptionId: string | null; clientSecret: string | null }> {
  const asObj = err as {
    raw?: { subscription?: unknown; payment_intent?: unknown };
    subscription?: unknown;
    payment_intent?: unknown;
  };
  const subRef = asObj.subscription ?? asObj.raw?.subscription ?? null;
  const subId =
    typeof subRef === "string"
      ? subRef
      : subRef && typeof subRef === "object" && "id" in (subRef as object)
        ? String((subRef as { id: unknown }).id)
        : null;

  if (!subId) return { subscriptionId: null, clientSecret: null };

  try {
    const sub = await api.subscriptions.retrieve(subId, {
      expand: ["latest_invoice.payment_intent"],
    });
    const invoice =
      sub.latest_invoice && typeof sub.latest_invoice !== "string"
        ? (sub.latest_invoice as Stripe.Invoice & {
            payment_intent?: Stripe.PaymentIntent | string | null;
          })
        : null;
    const pi = invoice?.payment_intent;
    const clientSecret =
      pi && typeof pi !== "string" ? (pi.client_secret ?? null) : null;
    return { subscriptionId: subId, clientSecret };
  } catch {
    return { subscriptionId: subId, clientSecret: null };
  }
}
