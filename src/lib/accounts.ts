/**
 * Persistence layer for Account and Entitlement records, plus the
 * stripe-customer-to-account reverse index used by webhook handlers.
 *
 * Every read here is shape-migrating: legacy Entitlement records that
 * still carry `credits: number` get upgraded to the bucketed shape on
 * the fly, missing `subscriptionHistory` arrays get seeded from the
 * current stripeSubscriptionId, and Account records that still carry
 * the dead top-level stripeCustomerId field get stripped. Migrations
 * persist the upgraded shape back so subsequent reads are cache hits.
 *
 * Related: src/lib/types.ts (record shapes), src/lib/redis.ts (KEY
 * factory), src/lib/session.ts (calls getAccountById on every request),
 * src/lib/stripe-webhook.ts (resolves customer to account via the
 * reverse index here).
 */
import { redis, KEY } from "./redis";
import type {
  Account,
  CreditBuckets,
  Entitlement,
  EntitlementTier,
} from "./types";
import { getTierAllotment } from "./pricing";

/**
 * Read an entitlement raw from Redis and upgrade its shape on the fly.
 * Handles two independent migrations:
 *   1. Legacy flat `credits: number` → CreditBuckets object
 *   2. Missing `subscriptionHistory` array → initialize from current
 *      stripeSubscriptionId (so cancel/resubscribe cycles don't lose
 *      the older subscription ID from the audit trail).
 *
 * Returns { entitlement, dirty } — dirty=true when any upgrade ran, so
 * the caller can persist the upgraded shape back.
 */
function migrateEntitlementInPlace(
  raw: LegacyOrCurrentEntitlement,
): { entitlement: Entitlement; dirty: boolean } {
  let dirty = false;

  // --- credits ---
  let credits: CreditBuckets | null = null;
  const rawCredits = raw.credits;
  if (rawCredits === null || rawCredits === undefined) {
    credits = null;
  } else if (isBuckets(rawCredits)) {
    credits = rawCredits;
  } else {
    // Legacy flat number — migrate.
    const allotment = raw.tier ? getTierAllotment(raw.tier) : 0;
    const periodStart = raw.createdAt ?? new Date().toISOString();
    const periodEnd =
      raw.renewalDate ??
      new Date(
        new Date(periodStart).getTime() + 30 * 24 * 3600 * 1000,
      ).toISOString();
    credits = {
      monthly: typeof rawCredits === "number" ? rawCredits : 0,
      monthlyAllotment: allotment,
      addon: 0,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      firstMonthBonusGranted: false,
    };
    dirty = true;
  }

  // --- subscriptionHistory ---
  let history = Array.isArray(raw.subscriptionHistory)
    ? [...raw.subscriptionHistory]
    : null;
  if (history === null) {
    history = raw.stripeSubscriptionId ? [raw.stripeSubscriptionId] : [];
    dirty = true;
  } else if (
    raw.stripeSubscriptionId &&
    !history.includes(raw.stripeSubscriptionId)
  ) {
    history.push(raw.stripeSubscriptionId);
    dirty = true;
  }

  return {
    entitlement: {
      ...raw,
      credits,
      subscriptionHistory: history,
    } as Entitlement,
    dirty,
  };
}

type LegacyOrCurrentEntitlement = Omit<
  Entitlement,
  "credits" | "subscriptionHistory"
> & {
  credits: number | CreditBuckets | null;
  subscriptionHistory?: string[] | null;
  tier: EntitlementTier | null;
};

function isBuckets(v: unknown): v is CreditBuckets {
  return (
    !!v &&
    typeof v === "object" &&
    "monthly" in (v as object) &&
    "addon" in (v as object)
  );
}

/**
 * Read an Account by id. Returns null when the record is missing or
 * has been soft-deleted (deletedAt set, used for the 30-day recovery
 * window). Runs the legacy field stripper on the fly and persists
 * the cleaned shape back to Redis on the first read.
 *
 * @param accountId - Account UUID.
 * @returns Live Account or null when missing / soft-deleted.
 */
export async function getAccountById(
  accountId: string,
): Promise<Account | null> {
  const acc = await redis().get<Account & { stripeCustomerId?: unknown }>(
    KEY.account(accountId),
  );
  if (!acc || acc.deletedAt) return null;
  return migrateAccountInPlace(acc);
}

/**
 * Legacy Account records stored stripeCustomerId on the account. That
 * field is dead — billing is per-entitlement, not per-account. Strip
 * the field on read and persist the cleaned record so the next read is
 * a cache hit. Safe to call on already-clean records (no-op).
 */
async function migrateAccountInPlace(
  acc: Account & { stripeCustomerId?: unknown },
): Promise<Account> {
  if (!("stripeCustomerId" in acc)) return acc;
  // Shallow clone without the dead field.
  const {
    stripeCustomerId: _legacy,
    ...clean
  } = acc as Account & { stripeCustomerId?: unknown };
  void _legacy;
  const migrated = clean as Account;
  try {
    await redis().set(KEY.account(migrated.accountId), migrated);
  } catch {
    // Migration write failure is non-fatal — next read will try again.
  }
  return migrated;
}

/**
 * Resolve an Account's id from its email via the email-to-account
 * reverse index. Returns null for unknown emails.
 *
 * @param email - Customer email (case-insensitive lookup).
 * @returns Account UUID or null when no account with that email.
 */
export async function getAccountIdByEmail(
  email: string,
): Promise<string | null> {
  const id = await redis().get<string>(KEY.emailIndex(email));
  return id ?? null;
}

/**
 * Convenience wrapper that pulls an Account directly by email.
 * Returns null for unknown emails or soft-deleted accounts.
 *
 * @param email - Customer email (case-insensitive lookup).
 * @returns Account or null.
 */
export async function getAccountByEmail(
  email: string,
): Promise<Account | null> {
  const id = await getAccountIdByEmail(email);
  if (!id) return null;
  return getAccountById(id);
}

/**
 * Persist an Account record and refresh its email-index entry. Used by
 * signup, profile edits, password changes, and email verification
 * stamping. Email rotation requires the deleted-old-email step in
 * rotateAccountEmail below; saveAccount alone leaves the prior email
 * pointing at this account.
 *
 * @param account - Full Account record. Slug is account.accountId.
 */
export async function saveAccount(account: Account): Promise<void> {
  const r = redis();
  await r.set(KEY.account(account.accountId), account);
  await r.set(KEY.emailIndex(account.email), account.accountId);
}

/**
 * Persist an Account and atomically remove the old email's reverse
 * index entry. Called by /api/account PATCH when the email field
 * changes. Same-email-but-different-case is treated as no rotation.
 *
 * @param account - The Account with its NEW email value already set.
 * @param oldEmail - The email the Account had before this update.
 */
export async function rotateAccountEmail(
  account: Account,
  oldEmail: string,
): Promise<void> {
  const r = redis();
  if (oldEmail.toLowerCase() !== account.email.toLowerCase()) {
    await r.del(KEY.emailIndex(oldEmail));
  }
  await saveAccount(account);
}

/**
 * Soft-delete an Account. Stamps deletedAt + updatedAt and removes the
 * email reverse-index entry, freeing the address for re-registration
 * during the 30-day recovery window. The underlying Account record
 * stays in Redis so support can restore it on request.
 *
 * @param accountId - Account UUID to soft-delete.
 */
export async function softDeleteAccount(accountId: string): Promise<void> {
  const r = redis();
  const acc = await r.get<Account>(KEY.account(accountId));
  if (!acc) return;
  acc.deletedAt = new Date().toISOString();
  acc.updatedAt = acc.deletedAt;
  await r.set(KEY.account(accountId), acc);
  await r.del(KEY.emailIndex(acc.email));
  // Per spec: 30-day recovery window — records remain but email index is freed.
}

/**
 * Read every Entitlement bound to an Account. Walks the
 * accountEntitlements SET, hydrates each compound `{product}::{portalId}`
 * into the underlying entitlement record, runs the shape migrator on
 * the fly, and persists upgraded shapes back. Filters out stale set
 * members whose backing record no longer points at this account.
 *
 * @param accountId - Account UUID.
 * @returns Entitlements sorted by createdAt ascending.
 */
export async function getEntitlementsForAccount(
  accountId: string,
): Promise<Entitlement[]> {
  const r = redis();
  const ids = (await r.smembers(KEY.accountEntitlements(accountId))) ?? [];
  if (ids.length === 0) return [];
  const results: Entitlement[] = [];
  const upgrades: Entitlement[] = [];
  for (const compound of ids) {
    const [product, portalId] = compound.split("::");
    if (!product || !portalId) continue;
    const raw = await r.get<LegacyOrCurrentEntitlement>(
      KEY.entitlement(product, portalId),
    );
    if (!raw || raw.accountId !== accountId) continue;
    const { entitlement: ent, dirty } = migrateEntitlementInPlace(raw);
    if (dirty) upgrades.push(ent);
    results.push(ent);
  }
  // Persist shape upgrades so the next read is a cache hit.
  for (const ent of upgrades) {
    await r.set(KEY.entitlement(ent.product, ent.portalId), ent);
  }
  return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getEntitlement(
  product: string,
  portalId: string,
): Promise<Entitlement | null> {
  const raw = await redis().get<LegacyOrCurrentEntitlement>(
    KEY.entitlement(product, portalId),
  );
  if (!raw) return null;
  const { entitlement: ent, dirty } = migrateEntitlementInPlace(raw);
  if (dirty) {
    await redis().set(KEY.entitlement(product, portalId), ent);
  }
  return ent;
}

export async function saveEntitlement(
  entitlement: Entitlement,
): Promise<void> {
  await redis().set(
    KEY.entitlement(entitlement.product, entitlement.portalId),
    entitlement,
  );
}

export async function linkEntitlementToAccount(
  entitlement: Entitlement,
): Promise<void> {
  if (!entitlement.accountId) {
    throw new Error("Cannot link: entitlement has no accountId");
  }
  const r = redis();
  await r.set(
    KEY.entitlement(entitlement.product, entitlement.portalId),
    entitlement,
  );
  await r.sadd(
    KEY.accountEntitlements(entitlement.accountId),
    `${entitlement.product}::${entitlement.portalId}`,
  );
}

// ---- Stripe customer <-> account reverse lookup -------------------------

/**
 * Write the reverse index dunamis:stripe-customer-to-account:{id}.
 * Called whenever a new Stripe Customer is created for an entitlement
 * so webhooks can resolve customerId → accountId without walking
 * every entitlement for the account.
 *
 * Note: the Customer itself lives on the Entitlement, not the Account.
 * This helper ONLY writes the reverse index — callers are responsible
 * for persisting stripeCustomerId on the entitlement they just linked.
 */
export async function linkStripeCustomerToAccount(
  accountId: string,
  stripeCustomerId: string,
): Promise<void> {
  await redis().set(
    KEY.stripeCustomerToAccount(stripeCustomerId),
    accountId,
  );
}

export async function unlinkStripeCustomerFromAccount(
  stripeCustomerId: string,
): Promise<void> {
  await redis().del(KEY.stripeCustomerToAccount(stripeCustomerId));
}

export async function getAccountIdByStripeCustomerId(
  stripeCustomerId: string,
): Promise<string | null> {
  const id = await redis().get<string>(
    KEY.stripeCustomerToAccount(stripeCustomerId),
  );
  return id ?? null;
}
