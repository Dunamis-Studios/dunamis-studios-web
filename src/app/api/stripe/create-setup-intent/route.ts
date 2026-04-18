import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { getCurrentSession } from "@/lib/session";
import {
  getEntitlement,
  saveEntitlement,
  setStripeCustomerId,
} from "@/lib/accounts";
import { portalIdSchema } from "@/lib/validation";

const bodySchema = z.object({
  product: z.literal("debrief"),
  portalId: portalIdSchema,
});

/**
 * Step 1 of the SetupIntent-first subscribe flow.
 *
 * Creates (or reuses) a Stripe Customer for the signed-in account, then
 * creates an off-session SetupIntent attached to that customer. The
 * frontend mounts Stripe Elements against the returned clientSecret,
 * collects the payment method, and calls confirmSetup to attach it.
 *
 * The SetupIntent is tier-agnostic. After the user confirms the
 * payment method, POST /api/stripe/create-subscription creates the
 * actual subscription using the stored payment method.
 */
export async function POST(req: Request) {
  const s = await getCurrentSession();
  if (!s) return apiError(401, "unauthenticated", "Please sign in.");

  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { product, portalId } = parsed.data;

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

  const api = stripe();

  // Lazy-create / reuse the Stripe Customer. Prefer the entitlement-level
  // pairing; fall back to the account-level id; else create.
  let customerId =
    entitlement.stripeCustomerId ?? s.account.stripeCustomerId ?? null;

  if (!customerId) {
    try {
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
      await setStripeCustomerId(s.account, customerId);
    } catch (err) {
      return apiError(400, "stripe_error", stripeMessage(err));
    }
  }

  // Persist the customer pairing on the entitlement so future lookups
  // (webhook, change-plan, cancel, portal) don't have to re-walk the
  // account object.
  if (entitlement.stripeCustomerId !== customerId) {
    entitlement.stripeCustomerId = customerId;
    await saveEntitlement(entitlement);
  }

  try {
    const setupIntent = await api.setupIntents.create({
      customer: customerId,
      usage: "off_session",
      payment_method_types: ["card"],
      metadata: {
        dunamisAccountId: s.account.accountId,
        product,
        portalId,
      },
    });

    if (!setupIntent.client_secret) {
      return apiError(
        500,
        "missing_client_secret",
        "Stripe did not return a SetupIntent client secret.",
      );
    }

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
      setupIntentId: setupIntent.id,
    });
  } catch (err) {
    return apiError(400, "stripe_error", stripeMessage(err));
  }
}

function stripeMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Stripe error.";
}
