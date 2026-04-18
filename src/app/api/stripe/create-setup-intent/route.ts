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
import { portalIdSchema } from "@/lib/validation";

const bodySchema = z.object({
  product: z.literal("debrief"),
  portalId: portalIdSchema,
  /**
   * When the client is abandoning a previous SetupIntent (modal
   * remount, retry after error), pass its id so we can cancel it
   * server-side instead of leaving it to linger until Stripe's 23-hour
   * auto-expire.
   */
  previousSetupIntentId: z.string().min(1).max(200).optional(),
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
  const { product, portalId, previousSetupIntentId } = parsed.data;

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

  // Best-effort cancel of the abandoned SetupIntent. Non-fatal: a
  // missing / already-canceled id can't block creating a new one.
  if (previousSetupIntentId) {
    await cancelSetupIntentSafely(api, previousSetupIntentId);
  }

  // Lazy-create / reuse the Stripe Customer. Each entitlement (= portal)
  // owns its own Customer. No account-level fallback — billing is
  // strictly per-portal, so an account with Debrief on two portals
  // ends up with two distinct Customers.
  let customerId = entitlement.stripeCustomerId ?? null;

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
      entitlement.stripeCustomerId = customerId;
      await saveEntitlement(entitlement);
      // Reverse index: webhook lookups need customerId → accountId.
      await linkStripeCustomerToAccount(s.account.accountId, customerId);
    } catch (err) {
      return apiError(400, "stripe_error", stripeMessage(err));
    }
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

async function cancelSetupIntentSafely(
  api: ReturnType<typeof stripe>,
  setupIntentId: string,
): Promise<void> {
  try {
    const si = await api.setupIntents.retrieve(setupIntentId);
    // Never invalidate a succeeded SetupIntent — it may be about to be
    // consumed by a concurrent subscription create. Canceled ones are
    // already dead, no-op.
    if (si.status === "succeeded" || si.status === "canceled") return;
    await api.setupIntents.cancel(setupIntentId);
  } catch (err) {
    console.warn(
      `[create-setup-intent] previous ${setupIntentId} cancel skipped:`,
      err instanceof Error ? err.message : err,
    );
  }
}
