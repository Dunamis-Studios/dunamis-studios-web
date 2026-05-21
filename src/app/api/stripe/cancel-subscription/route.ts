/**
 * POST /api/stripe/cancel-subscription: schedule cancel-at-period-end
 * on the Debrief subscription tied to a portal. Customer keeps access
 * through the current billing period; the webhook flips the
 * entitlement to canceled when Stripe emits the final
 * customer.subscription.deleted event. Mirror surface for reversing
 * the cancel is /api/stripe/reactivate-subscription.
 *
 * Refuses on a 404 when the entitlement is owned by another account
 * so the response cannot be used to probe other customers' portals.
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
      "This entitlement has no active subscription to cancel.",
    );
  }

  const api = stripe();
  await api.subscriptions.update(entitlement.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // Optimistically flag on the entitlement so the UI reflects the state
  // change immediately — the webhook will reconfirm on the next
  // subscription.updated tick.
  entitlement.cancelAtPeriodEnd = true;
  await saveEntitlement(entitlement);

  return NextResponse.json({ ok: true });
}
