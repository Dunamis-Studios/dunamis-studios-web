import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { getCurrentSession } from "@/lib/session";
import {
  getEntitlement,
  setStripeCustomerId,
} from "@/lib/accounts";
import { getCreditPack } from "@/lib/pricing";
import { portalIdSchema } from "@/lib/validation";

const bodySchema = z.object({
  product: z.literal("debrief"),
  portalId: portalIdSchema,
  pack: z.enum(["small", "medium", "large", "bulk"]),
  /**
   * The Buy credits modal recreates the PaymentIntent on every pack
   * selection change (clientSecret is amount-bound). Pass the id of
   * the previous PI so we can cancel it server-side — otherwise each
   * pack toggle leaves a stale incomplete intent in Stripe's dashboard
   * until the 23-hour auto-expire.
   */
  previousPaymentIntentId: z.string().min(1).max(200).optional(),
});

export async function POST(req: Request) {
  const s = await getCurrentSession();
  if (!s) return apiError(401, "unauthenticated", "Please sign in.");

  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { product, portalId, pack, previousPaymentIntentId } = parsed.data;

  const entitlement = await getEntitlement(product, portalId);
  if (!entitlement || entitlement.accountId !== s.account.accountId) {
    return apiError(404, "not_found", "Entitlement not found.");
  }

  const packSpec = getCreditPack(pack);
  const api = stripe();

  // Cancel the abandoned PaymentIntent from the previous pack selection
  // so the Stripe dashboard doesn't accumulate incomplete rows.
  if (previousPaymentIntentId) {
    await cancelPaymentIntentSafely(api, previousPaymentIntentId);
  }

  // Reuse existing Customer or create one — credit packs stack on the
  // same Customer whether or not a subscription is active, so this path
  // mirrors create-subscription's lazy-customer logic.
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

  const paymentIntent = await api.paymentIntents.create({
    amount: packSpec.amountCents,
    currency: "usd",
    customer: customerId,
    description: `Debrief credit pack — ${packSpec.label} (${packSpec.credits} credits)`,
    automatic_payment_methods: { enabled: true },
    metadata: {
      dunamisAccountId: s.account.accountId,
      product,
      portalId,
      packName: pack,
      creditAmount: String(packSpec.credits),
    },
  });

  if (!paymentIntent.client_secret) {
    return apiError(
      500,
      "missing_client_secret",
      "Stripe did not return a payment intent secret.",
    );
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    pack: {
      name: pack,
      credits: packSpec.credits,
      dollars: packSpec.dollars,
    },
  });
}

async function cancelPaymentIntentSafely(
  api: ReturnType<typeof stripe>,
  paymentIntentId: string,
): Promise<void> {
  try {
    const pi = await api.paymentIntents.retrieve(paymentIntentId);
    // Only cancel PIs that are still abandonable. Succeeded ones have
    // already charged; canceled ones are no-ops; processing ones are
    // mid-charge and canceling them would be destructive.
    if (
      pi.status === "succeeded" ||
      pi.status === "canceled" ||
      pi.status === "processing"
    ) {
      return;
    }
    await api.paymentIntents.cancel(paymentIntentId);
  } catch (err) {
    console.warn(
      `[buy-credits] previous ${paymentIntentId} cancel skipped:`,
      err instanceof Error ? err.message : err,
    );
  }
}
