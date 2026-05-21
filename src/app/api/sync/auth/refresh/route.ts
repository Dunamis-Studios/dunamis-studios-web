/**
 * Trade a still-valid 24h Sync access token for a fresh 24h token.
 * Fully expired subscriptions (status=expired, blobs deleted) cannot
 * refresh; the customer must re-subscribe and re-pair. Cancelled-in-
 * grace can still refresh because read paths render the warning UI
 * themselves.
 */
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { bearerCustomerId, issueAccessToken } from "@/lib/sync/auth";
import { getSyncCustomer } from "@/lib/sync/customer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync/auth/refresh
 *
 * Trade a still-valid Bearer access token for a fresh one. The 24h TTL
 * window is short enough that an idle client may cross it; this
 * endpoint extends without forcing the customer back through Stripe
 * Checkout or the QR scan.
 *
 * Refresh is gated on the customer's current Sync status: a customer
 * whose subscription has fully expired (status = "expired", blobs
 * deleted) cannot mint a new token. They re-subscribe and re-pair
 * fresh. Cancelled-in-grace customers can still refresh — the read
 * paths render the appropriate warning UI.
 */
export async function POST(request: Request) {
  const customerId = await bearerCustomerId(request);
  if (!customerId) {
    return apiError(
      401,
      "unauthenticated",
      "Refresh requires a still-valid Bearer access token.",
    );
  }
  const record = await getSyncCustomer(customerId);
  if (record?.sync_status === "expired") {
    return apiError(
      403,
      "subscription_expired",
      "Sync subscription has fully expired. Re-subscribe and re-pair to continue.",
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
