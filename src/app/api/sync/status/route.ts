/**
 * Read the caller's Sync customer-state record. Dual-auth: Bearer
 * access token (Atelier desktop, PWA) OR session cookie (web). A
 * synthetic "none" record stands in for customers who have never
 * activated Sync so the UI can branch on sync_status uniformly
 * without special-casing the absent-record path.
 */
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { bearerCustomerId } from "@/lib/sync/auth";
import {
  getCustomerIdForAccount,
  getSyncCustomer,
} from "@/lib/sync/customer";
import type { SyncCustomerState } from "@/lib/sync/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/sync/status
 *
 * Returns the caller's Sync customer-state record. Authenticates via
 * either a Bearer access token (Atelier or PWA) or a session cookie
 * (web client / customer portal). Customers who have never activated
 * Sync receive a synthetic "none" record so the UI can branch on
 * sync_status without a special "no record" path.
 */
export async function GET(request: Request) {
  const customerId = await resolveCustomerId(request);
  if (!customerId) {
    return apiError(
      401,
      "unauthenticated",
      "Sync requires a Bearer access token or an authenticated session.",
    );
  }
  const record = await getSyncCustomer(customerId);
  return NextResponse.json({ record: record ?? syntheticNone(customerId) });
}

async function resolveCustomerId(request: Request): Promise<string | null> {
  const fromBearer = await bearerCustomerId(request);
  if (fromBearer) return fromBearer;
  const session = await getCurrentSession();
  if (!session) return null;
  return getCustomerIdForAccount(session.account.accountId);
}

function syntheticNone(customerId: string): SyncCustomerState {
  return {
    customer_id: customerId,
    email: "",
    sync_status: "none",
    sync_trial_ends_at: null,
    sync_grace_ends_at: null,
    sync_subscription_id: null,
    sync_activated_at: null,
    sync_active_through: null,
    current_key_generation: 1,
    paired_pwa_devices_count: 0,
    first_sync_completed_at: null,
    last_status_change_at: new Date().toISOString(),
    trial_t3_email_sent_at: null,
    trial_t0_email_sent_at: null,
  };
}
