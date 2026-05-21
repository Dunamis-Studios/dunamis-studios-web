/**
 * Daily cron: scan Sync customers in cancelled_in_grace, hard-
 * delete every blob and manifest once their grace window expires,
 * email a final "Sync data deleted" notice, and flip the customer
 * record to expired. CRON_SECRET bearer auth via authorizeCron.
 */
import { NextResponse } from "next/server";

import { redis } from "@/lib/redis";
import {
  getSyncCustomer,
  listGraceCustomerIds,
  saveSyncCustomer,
} from "@/lib/sync/customer";
import { authorizeCron } from "@/lib/sync/cron-auth";
import { sendGraceExpiredEmail } from "@/lib/sync/email";
import {
  buildCustomerPrefix,
  getStorage,
} from "@/lib/sync/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily cron: scan customers in `cancelled_in_grace`, delete every
 * blob and tombstone for customers whose grace has ended, and flip
 * their status to `expired`.
 *
 * The status flip is the gate: once expired, /refresh rejects the
 * Bearer token and any further data-plane calls return 403. We keep
 * the customer record itself for refund / dispute traceability — only
 * the bytes get deleted.
 */
export async function GET(request: Request) {
  const authResp = authorizeCron(request);
  if (authResp) return authResp;

  const now = Date.now();
  const ids = await listGraceCustomerIds();
  let scanned = 0;
  let deletedCustomers = 0;
  let totalBlobsDeleted = 0;

  const storage = getStorage();
  const r = redis();

  for (const customerId of ids) {
    scanned++;
    const record = await getSyncCustomer(customerId);
    if (!record || record.sync_status !== "cancelled_in_grace") continue;
    if (!record.sync_grace_ends_at) continue;
    if (Date.parse(record.sync_grace_ends_at) > now) continue;

    // Grace has ended. Delete every blob, then the tombstone-index
    // rows, then flip status.
    const prefix = buildCustomerPrefix(customerId);
    const blobs = await storage.listBlobs(prefix);
    for (const b of blobs) {
      await storage.deleteBlob(b.storage_key);
      totalBlobsDeleted++;
    }
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
    const updated = { ...record, sync_status: "expired" as const };
    await saveSyncCustomer(updated, record);
    deletedCustomers++;
    if (record.email) {
      await sendGraceExpiredEmail(record.email, record.sync_grace_ends_at);
    }
    // Drop the account → customer reverse index. The customer record
    // itself stays; the link from the live session no longer routes.
    // We can't recover accountId from Redis without another lookup —
    // skipped here, falls off when the account itself is touched.
  }

  console.log(
    `[cron sync-grace-cleanup] scanned=${scanned} deletedCustomers=${deletedCustomers} totalBlobsDeleted=${totalBlobsDeleted}`,
  );
  return NextResponse.json({
    ok: true,
    scanned,
    deletedCustomers,
    totalBlobsDeleted,
    ran_at: new Date(now).toISOString(),
  });
}
