/**
 * Mint a Stripe Billing Portal session for the caller's Sync
 * subscription. Used by the dunamisstudios.net account UI and the
 * Manage Subscription link inside Atelier. Intentionally cookie-
 * only auth: managing the subscription is a deliberate web action,
 * not something a Bearer-token-only PWA flow should drive.
 */
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { getCustomerIdForAccount } from "@/lib/sync/customer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync/portal
 *
 * Open a Stripe Billing Portal session scoped to the caller's Sync
 * customer. Used from the dunamisstudios.net account UI and from a
 * "Manage subscription" link inside Atelier (which opens the URL in
 * the default browser).
 *
 * Auth: session cookie. The portal is intentionally not Bearer-token
 * accessible — managing the subscription is a deliberate web action,
 * not something Atelier should be able to drive directly.
 */
export async function POST(request: Request) {
  // request param kept for symmetry with other routes; unused here.
  void request;

  const session = await getCurrentSession();
  if (!session) {
    return apiError(401, "unauthenticated", "Sign in to manage your subscription.");
  }
  const customerId = await getCustomerIdForAccount(session.account.accountId);
  if (!customerId) {
    return apiError(
      404,
      "no_sync_customer",
      "No Sync subscription on file for this account.",
    );
  }

  const appUrl = process.env.APP_URL ?? "https://www.dunamisstudios.net";
  const portal = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/account`,
  });

  return NextResponse.json({ url: portal.url });
}
