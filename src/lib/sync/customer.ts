import { redis } from "../redis";
import { SYNC_KEY } from "./redis-keys";
import type { SyncCustomerState, SyncStatus } from "./types";

/**
 * Read the Sync customer-state record. Returns null if no record exists
 * for the given Stripe customer id (a customer who has never activated
 * Sync has no record — checkout creates the row).
 */
export async function getSyncCustomer(
  customerId: string,
): Promise<SyncCustomerState | null> {
  return redis().get<SyncCustomerState>(SYNC_KEY.customer(customerId));
}

/**
 * Resolve a Dunamis account id to its Stripe customer id, scoped to
 * Sync. Returns null if the account has never paid for Sync. This is
 * the opposite direction of the existing
 * `KEY.stripeCustomerToAccount` reverse index — written by the Sync
 * webhook on first checkout completion so session-cookie routes
 * (portal, export, account-delete) can resolve their caller's customer
 * record without scanning.
 */
export async function getCustomerIdForAccount(
  accountId: string,
): Promise<string | null> {
  return redis().get<string>(SYNC_KEY.accountToCustomer(accountId));
}

/** Write the account→customer reverse index. Called from the webhook. */
export async function setCustomerIdForAccount(
  accountId: string,
  customerId: string,
): Promise<void> {
  await redis().set(SYNC_KEY.accountToCustomer(accountId), customerId);
}

/**
 * Write the customer-state record. Maintains the trial-active and
 * cancelled-in-grace index sets so the cron jobs can iterate without
 * scanning the full customer namespace.
 *
 * Also appends an entry to the activity log if the status changed.
 */
export async function saveSyncCustomer(
  next: SyncCustomerState,
  prev: SyncCustomerState | null,
): Promise<void> {
  const r = redis();
  const now = new Date().toISOString();
  const willChange = prev?.sync_status !== next.sync_status;
  if (willChange) {
    next.last_status_change_at = now;
  }

  await r.set(SYNC_KEY.customer(next.customer_id), next);

  if (willChange) {
    if (prev?.sync_status === "trial_active") {
      await r.srem(SYNC_KEY.trialActiveIndex(), next.customer_id);
    }
    if (prev?.sync_status === "cancelled_in_grace") {
      await r.srem(SYNC_KEY.graceIndex(), next.customer_id);
    }
    if (next.sync_status === "trial_active") {
      await r.sadd(SYNC_KEY.trialActiveIndex(), next.customer_id);
    }
    if (next.sync_status === "cancelled_in_grace") {
      await r.sadd(SYNC_KEY.graceIndex(), next.customer_id);
    }
    await appendActivityLog(next.customer_id, {
      at: now,
      from: prev?.sync_status ?? "none",
      to: next.sync_status,
    });
  }
}

/**
 * Transition a customer to a new status. Centralizes the read-modify-
 * write pattern so callers don't forget to maintain the index sets and
 * the activity log.
 *
 * The mutator receives the current state (or a default empty state for
 * a new customer) and returns the next state. Returning the same object
 * is fine — the function is reference-comparison-free.
 */
export async function upsertSyncCustomer(
  customerId: string,
  email: string,
  mutator: (state: SyncCustomerState) => SyncCustomerState,
): Promise<SyncCustomerState> {
  const prev = await getSyncCustomer(customerId);
  const baseline: SyncCustomerState = prev ?? {
    customer_id: customerId,
    email,
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
  // Always re-stamp email — the customer's email on the Account is the
  // source of truth and may have changed since the last write. The Sync
  // record's email is convenience-only (used for transactional emails);
  // the Stripe customer link is the authoritative join.
  baseline.email = email;
  const next = mutator(baseline);
  await saveSyncCustomer(next, prev);
  return next;
}

/** Read the most recent `limit` activity log entries (newest first). */
export async function readActivityLog(
  customerId: string,
  limit = 25,
): Promise<{ at: string; from: SyncStatus; to: SyncStatus }[]> {
  const raw = await redis().lrange<string>(
    SYNC_KEY.activityLog(customerId),
    0,
    limit - 1,
  );
  return raw
    .map((s) => {
      try {
        return JSON.parse(s) as { at: string; from: SyncStatus; to: SyncStatus };
      } catch {
        return null;
      }
    })
    .filter((x): x is { at: string; from: SyncStatus; to: SyncStatus } => !!x);
}

async function appendActivityLog(
  customerId: string,
  entry: { at: string; from: SyncStatus; to: SyncStatus },
): Promise<void> {
  const r = redis();
  await r.lpush(SYNC_KEY.activityLog(customerId), JSON.stringify(entry));
  await r.ltrim(SYNC_KEY.activityLog(customerId), 0, 49);
}

/**
 * Return all customer ids currently in the trial_active index. Used by
 * the trial-expiry cron. SET membership is the source of truth — a
 * customer record whose status drifted out of trial_active without the
 * index being updated would still show up here, but the cron defensively
 * re-reads the customer record before acting, so a drifted row is a
 * no-op rather than a wrong-action.
 */
export async function listTrialActiveCustomerIds(): Promise<string[]> {
  return (await redis().smembers(SYNC_KEY.trialActiveIndex())) ?? [];
}

/** Same shape as listTrialActiveCustomerIds, for cancelled_in_grace. */
export async function listGraceCustomerIds(): Promise<string[]> {
  return (await redis().smembers(SYNC_KEY.graceIndex())) ?? [];
}
