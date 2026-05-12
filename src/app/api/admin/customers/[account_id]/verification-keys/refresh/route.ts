import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { getCurrentAdminSession } from "@/lib/session";
import { invalidateCustomerVerificationKeyCache } from "@/lib/admin/verification-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/customers/[account_id]/verification-keys/refresh
 *
 * Bust the 5-minute Redis cache that backs the Verification Keys
 * section on the customer detail page. Client component calls this
 * and then reloads the page so the next render pulls fresh tickets
 * from the HubSpot Search API.
 *
 * Read-only against HubSpot (the helper that re-pulls runs on the
 * server-rendered admin page, not here), so this is not audited via
 * runAdminAction. There is no underlying mutation to log.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ account_id: string }> },
) {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    return apiError(401, "unauthenticated", "Sign in as an admin.");
  }
  const { account_id } = await context.params;
  await invalidateCustomerVerificationKeyCache(account_id);
  return NextResponse.json({ ok: true });
}
