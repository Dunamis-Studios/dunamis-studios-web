import { NextResponse } from "next/server";

import {
  getSyncCustomer,
  listTrialActiveCustomerIds,
  upsertSyncCustomer,
} from "@/lib/sync/customer";
import { authorizeCron } from "@/lib/sync/cron-auth";
import {
  sendTrialT0Email,
  sendTrialT3Email,
} from "@/lib/sync/email";
import type { SyncCustomerState } from "@/lib/sync/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const T3_WINDOW_DAYS = 3;
const GRACE_DAYS = 30;

/**
 * Daily cron: scan customers in `trial_active`, fire T-3 reminder
 * emails, fire T-0 transition emails (and flip status to
 * cancelled_in_grace at T-0).
 *
 * The two trial_t*_email_sent_at fields prevent duplicate sends if
 * the cron runs more than once on the same UTC day or fires twice
 * around the boundary.
 *
 * Idempotency at status transition: when a customer's trial expires,
 * the status flip + T-0 send happen in the same upsert transaction.
 * A subsequent same-day re-run sees status="cancelled_in_grace" and
 * skips the customer entirely.
 */
export async function GET(request: Request) {
  const authResp = authorizeCron(request);
  if (authResp) return authResp;

  const now = Date.now();
  const ids = await listTrialActiveCustomerIds();
  let scanned = 0;
  let t3sent = 0;
  let t0sent = 0;
  let movedToGrace = 0;

  for (const customerId of ids) {
    scanned++;
    const record = await getSyncCustomer(customerId);
    if (!record || record.sync_status !== "trial_active") continue;
    if (!record.sync_trial_ends_at) continue;

    const trialEndMs = Date.parse(record.sync_trial_ends_at);
    if (Number.isNaN(trialEndMs)) continue;
    const msToEnd = trialEndMs - now;
    const daysToEnd = msToEnd / ONE_DAY_MS;

    if (daysToEnd <= 0) {
      // T-0 path: trial has ended. Move to grace and email.
      const graceEnd = new Date(now + GRACE_DAYS * ONE_DAY_MS).toISOString();
      const next = await upsertSyncCustomer(customerId, record.email, (s) => ({
        ...s,
        sync_status: "cancelled_in_grace",
        sync_grace_ends_at: graceEnd,
        trial_t0_email_sent_at:
          s.trial_t0_email_sent_at ?? new Date(now).toISOString(),
      }));
      if (record.email) {
        await sendTrialT0Email(record.email);
        t0sent++;
      }
      void (next satisfies SyncCustomerState);
      movedToGrace++;
      continue;
    }

    if (daysToEnd <= T3_WINDOW_DAYS && !record.trial_t3_email_sent_at) {
      // T-3 path: trial ends within the next 3 days. Send reminder
      // once; the timestamp guard prevents duplicate sends.
      await upsertSyncCustomer(customerId, record.email, (s) => ({
        ...s,
        trial_t3_email_sent_at: new Date(now).toISOString(),
      }));
      if (record.email) {
        await sendTrialT3Email(record.email, record.sync_trial_ends_at);
        t3sent++;
      }
    }
  }

  console.log(
    `[cron sync-trial-expiry] scanned=${scanned} t3sent=${t3sent} t0sent=${t0sent} movedToGrace=${movedToGrace}`,
  );
  return NextResponse.json({
    ok: true,
    scanned,
    t3sent,
    t0sent,
    movedToGrace,
    ran_at: new Date(now).toISOString(),
  });
}
