/**
 * Account-bound Sync access token issuance. The Atelier desktop is
 * already signed in to the Dunamis account and presents its account
 * JWT to receive a Sync token bound to whichever sync-customer
 * record is linked to that account. Replaces the post-checkout
 * exchange-code dance for accounts; the exchange/QR endpoint
 * remains for PWA pairing and legacy callers.
 */
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { getCurrentSessionAny } from "@/lib/session";
import { issueAccessToken } from "@/lib/sync/auth";
import { getCustomerIdForAccount } from "@/lib/sync/customer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync/auth/from-account
 *
 * Account-bound replacement for the exchange-code dance from Phase 1.
 * Atelier desktop is signed in to the dunamisstudios.net account
 * (Phase 2.1), so it presents its account JWT in the Bearer header
 * here and gets back a Sync access token bound to whichever customer
 * record is linked to that account.
 *
 * The account-to-customer link is the
 * `dunamis:sync:account-to-customer:{accountId}` index that the
 * Phase 1 Stripe webhook handlers already write when a checkout
 * carries `client_reference_id = accountId` (set in Phase 2.1's
 * /api/sync/checkout). For an account that has never bought a Sync
 * subscription, the lookup returns null and the endpoint returns 404
 * — the Settings UI on the desktop branches on that to render the
 * activation CTA instead of the active-subscription chrome.
 *
 * The QR-token path under /api/sync/auth/exchange remains for PWA
 * pairing, and the legacy `code` path stays in place for backward
 * compatibility with the Phase 2 MSI in Josh's smoke-test build until
 * Phase 2.1 ships and supersedes it.
 */
export async function POST(request: Request) {
  const session = await getCurrentSessionAny(request);
  if (!session) {
    return apiError(401, "unauthorized", "Sign in required.");
  }

  const customerId = await getCustomerIdForAccount(session.account.accountId);
  if (!customerId) {
    return apiError(
      404,
      "no_sync_subscription",
      "This account does not have a Dunamis Sync subscription yet.",
    );
  }

  const { token, exp } = await issueAccessToken(customerId);
  return NextResponse.json({
    access_token: token,
    token_type: "Bearer",
    expires_at: new Date(exp * 1000).toISOString(),
    customer_id: customerId,
  });
}
