import { redis, KEY } from "./redis";
import type {
  Account,
  CreditBuckets,
  Entitlement,
  EntitlementTier,
} from "./types";
import { getTierAllotment } from "./pricing";

/**
 * Read an entitlement raw from Redis and upgrade its shape in place if
 * it's still the legacy flat `credits: number`. Used by every read path
 * below so callers always see the new bucket shape.
 */
function migrateCreditsInPlace(
  raw: LegacyOrCurrentEntitlement,
): Entitlement {
  const credits = raw.credits;
  if (credits === null || credits === undefined) {
    return { ...raw, credits: null } as Entitlement;
  }
  if (isBuckets(credits)) {
    return raw as Entitlement;
  }
  // Legacy flat number — migrate.
  const allotment = raw.tier ? getTierAllotment(raw.tier) : 0;
  const periodStart = raw.createdAt ?? new Date().toISOString();
  const periodEnd =
    raw.renewalDate ??
    new Date(
      new Date(periodStart).getTime() + 30 * 24 * 3600 * 1000,
    ).toISOString();
  const buckets: CreditBuckets = {
    monthly: typeof credits === "number" ? credits : 0,
    monthlyAllotment: allotment,
    addon: 0,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    firstMonthBonusGranted: false,
  };
  return { ...raw, credits: buckets } as Entitlement;
}

type LegacyOrCurrentEntitlement = Omit<Entitlement, "credits"> & {
  credits: number | CreditBuckets | null;
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
    const ent = migrateCreditsInPlace(raw);
    if (raw.credits !== ent.credits) upgrades.push(ent);
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
  const ent = migrateCreditsInPlace(raw);
  if (raw.credits !== ent.credits) {
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
