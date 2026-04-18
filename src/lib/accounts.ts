import { redis, KEY } from "./redis";
import type { Account, Entitlement } from "./types";

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
  for (const compound of ids) {
    const [product, portalId] = compound.split("::");
    if (!product || !portalId) continue;
    const ent = await r.get<Entitlement>(KEY.entitlement(product, portalId));
    if (ent && ent.accountId === accountId) results.push(ent);
  }
  return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getEntitlement(
  product: string,
  portalId: string,
): Promise<Entitlement | null> {
  const ent = await redis().get<Entitlement>(
    KEY.entitlement(product, portalId),
  );
  return ent ?? null;
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
