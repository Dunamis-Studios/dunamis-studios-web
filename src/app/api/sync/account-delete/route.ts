import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { redis } from "@/lib/redis";
import { getCurrentSession } from "@/lib/session";
import {
  getCustomerIdForAccount,
  getSyncCustomer,
  saveSyncCustomer,
} from "@/lib/sync/customer";
import { SYNC_KEY } from "@/lib/sync/redis-keys";
import {
  buildCustomerPrefix,
  getStorage,
} from "@/lib/sync/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync/account-delete
 *
 * Customer-initiated immediate deletion. Honors the privacy-policy
 * commitment: "Data deletion: customer can request immediate deletion,
 * account closes, all blobs wiped within 24h." This endpoint does it
 * in seconds, not 24h — the SLA is a ceiling, not a floor.
 *
 * Auth: session cookie only (Bearer is rejected — deletion is a
 * deliberate web action). The account must own the Sync customer
 * record; cross-account deletion is impossible by construction.
 *
 * Effects:
 *   - All ciphertext blobs under the customer prefix are deleted.
 *   - Tombstone-index rows are deleted.
 *   - Sync customer-state record is set to status="expired" so any
 *     in-flight Bearer token is rejected on /refresh.
 *   - Account → customer reverse index entry is removed.
 *
 * The Stripe subscription itself is NOT cancelled here — the customer
 * is expected to do that via the Stripe portal first. Calling this
 * endpoint with an active subscription returns 409 to prevent the
 * "deletion completed but billing continued" footgun.
 */
export async function POST(request: Request) {
  void request;

  const session = await getCurrentSession();
  if (!session) {
    return apiError(401, "unauthenticated", "Sign in to delete Sync data.");
  }
  const customerId = await getCustomerIdForAccount(session.account.accountId);
  if (!customerId) {
    return apiError(
      404,
      "no_sync_customer",
      "No Sync data on file for this account.",
    );
  }
  const record = await getSyncCustomer(customerId);
  if (!record) {
    return apiError(
      404,
      "no_sync_customer",
      "No Sync data on file for this customer.",
    );
  }

  if (record.sync_status === "active" || record.sync_status === "trial_active") {
    return apiError(
      409,
      "subscription_active",
      "Cancel your subscription via the Stripe portal first, then delete.",
    );
  }

  const storage = getStorage();
  const prefix = buildCustomerPrefix(customerId);
  const blobs = await storage.listBlobs(prefix);
  for (const blob of blobs) {
    await storage.deleteBlob(blob.storage_key);
  }

  // Tombstone-index rows.
  const r = redis();
  let cursor: string = "0";
  let firstPage = true;
  for (let pages = 0; pages < 100; pages++) {
    if (!firstPage && cursor === "0") break;
    firstPage = false;
    const result = (await r.scan(cursor === "0" ? 0 : cursor, {
      match: `dunamis:sync:tombstone:${customerId}:*`,
      count: 200,
    })) as [string, string[]];
    const [next, batch] = result;
    if (batch.length > 0) await r.del(...batch);
    cursor = next;
  }

  // Mark the customer record expired (history-preserving — we keep the
  // Stripe ids and timestamps for refund / dispute traceability).
  const next = {
    ...record,
    sync_status: "expired" as const,
  };
  await saveSyncCustomer(next, record);

  // Drop the account → customer reverse index. The customer record
  // itself stays for audit; nothing routes back to it from a session.
  await r.del(SYNC_KEY.accountToCustomer(session.account.accountId));

  return NextResponse.json({
    ok: true,
    deleted_blob_count: blobs.length,
    sync_status: "expired",
  });
}
