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

export async function getAccountById(
  accountId: string,
): Promise<Account | null> {
  const acc = await redis().get<Account>(KEY.account(accountId));
  if (!acc || acc.deletedAt) return null;
  return acc;
}

export async function getAccountIdByEmail(
  email: string,
): Promise<string | null> {
  const id = await redis().get<string>(KEY.emailIndex(email));
  return id ?? null;
}

export async function getAccountByEmail(
  email: string,
): Promise<Account | null> {
  const id = await getAccountIdByEmail(email);
  if (!id) return null;
  return getAccountById(id);
}

export async function saveAccount(account: Account): Promise<void> {
  const r = redis();
  await r.set(KEY.account(account.accountId), account);
  await r.set(KEY.emailIndex(account.email), account.accountId);
}

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

export async function setStripeCustomerId(
  account: Account,
  stripeCustomerId: string,
): Promise<void> {
  const r = redis();
  account.stripeCustomerId = stripeCustomerId;
  account.updatedAt = new Date().toISOString();
  await r.set(KEY.account(account.accountId), account);
  await r.set(
    KEY.stripeCustomerToAccount(stripeCustomerId),
    account.accountId,
  );
}

export async function getAccountIdByStripeCustomerId(
  stripeCustomerId: string,
): Promise<string | null> {
  const id = await redis().get<string>(
    KEY.stripeCustomerToAccount(stripeCustomerId),
  );
  return id ?? null;
}
