import { NextResponse } from "next/server";
import { z } from "zod";
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
});

export async function POST(req: Request) {
  const s = await getCurrentSession();
  if (!s) return apiError(401, "unauthenticated", "Please sign in.");

  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { product, portalId, tier } = parsed.data;

  const entitlement = await getEntitlement(product, portalId);
  if (!entitlement || entitlement.accountId !== s.account.accountId) {
    return apiError(404, "not_found", "Entitlement not found.");
  }
  if (!entitlement.stripeSubscriptionId) {
    return apiError(
      400,
      "no_subscription",
      "This entitlement has no active subscription — use create-subscription instead.",
    );
  }

  const api = stripe();
  const sub = await api.subscriptions.retrieve(entitlement.stripeSubscriptionId);
  const item = sub.items.data[0];
  if (!item) {
    return apiError(500, "malformed_subscription", "Subscription has no items.");
  }

  const newPriceId = getPriceId(tier as EntitlementTier);
  await api.subscriptions.update(entitlement.stripeSubscriptionId, {
    items: [{ id: item.id, price: newPriceId }],
    proration_behavior: "create_prorations",
    payment_behavior: "allow_incomplete",
    metadata: {
      ...(sub.metadata ?? {}),
      dunamisAccountId: s.account.accountId,
      product,
      portalId,
      tier,
    },
  });

  // Webhook (customer.subscription.updated) writes the new tier + renewal.
  return NextResponse.json({ ok: true });
}
