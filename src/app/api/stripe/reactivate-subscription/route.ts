/**
 * POST /api/stripe/reactivate-subscription: reverse a scheduled
 * cancel by flipping cancel_at_period_end back to false. Only valid
 * while the subscription is still in its grace period (i.e., the
 * webhook has not yet processed customer.subscription.deleted).
 * After the period actually ends, the customer must subscribe
 * again rather than reactivate.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { stripe } from "@/lib/stripe";
import { getCurrentSession } from "@/lib/session";
import { getEntitlement, saveEntitlement } from "@/lib/accounts";
import { portalIdSchema } from "@/lib/validation";

const bodySchema = z.object({
  product: z.literal("debrief"),
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
  if (!entitlement.stripeSubscriptionId) {
    return apiError(
      400,
      "no_subscription",
      "No subscription to reactivate.",
    );
  }

  const api = stripe();
  await api.subscriptions.update(entitlement.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  entitlement.cancelAtPeriodEnd = false;
  await saveEntitlement(entitlement);

  return NextResponse.json({ ok: true });
}
