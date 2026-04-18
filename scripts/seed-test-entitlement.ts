/**
 * Seed a fake Debrief or Property Pulse entitlement into Redis and
 * link it to an existing account by email.
 *
 * Usage (loads .env.local automatically):
 *   npm run seed:entitlement -- \
 *     --email you@example.com \
 *     --product debrief \
 *     --portal-id 12345678 \
 *     --domain acme.com \
 *     --status active \
 *     --tier pro \
 *     --monthly-credits 250 \
 *     --addon-credits 0
 *
 * Re-running with the same product + portal-id updates the existing
 * record rather than creating a duplicate.
 */
import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import { Redis } from "@upstash/redis";
import { randomUUID } from "node:crypto";

// --------------------------------------------------------------------------
// CLI parsing (tiny, zero-dep)
// --------------------------------------------------------------------------
const argv = process.argv.slice(2);
function arg(flag: string, fallback?: string): string | undefined {
  const i = argv.indexOf(flag);
  if (i >= 0 && i + 1 < argv.length) return argv[i + 1];
  return fallback;
}
function has(flag: string): boolean {
  return argv.includes(flag);
}
if (has("--help") || has("-h")) {
  console.log(`
seed-test-entitlement — create or update an entitlement in Redis

Required:
  --email <email>          Account email to link the entitlement to
  --product <slug>         property-pulse | debrief
  --portal-id <id>         HubSpot portal id (any non-empty identifier)

Optional:
  --domain <host>          Default: example.com
  --installer <email>      Default: same as --email
  --status <status>        trial | active | past_due | canceled (default: active)
  --tier <tier>            starter | pro | enterprise (default: pro)
  --monthly-credits <n>    Current monthly balance (default: tier allotment)
  --addon-credits <n>      Addon bucket balance (default: 0)
  --renewal <iso>          Default: 30 days from now
  --unlink                 Remove this entitlement's link to the account
  --help, -h               Show this message
`);
  process.exit(0);
}

const email = arg("--email");
const product = arg("--product") as "property-pulse" | "debrief" | undefined;
const portalId = arg("--portal-id");
const portalDomain = arg("--domain", "example.com")!;
const installerEmail = arg("--installer") ?? email;
const status = arg("--status", "active") as
  | "trial"
  | "active"
  | "past_due"
  | "canceled";
const tier = arg("--tier", "pro") as "starter" | "pro" | "enterprise";
const unlink = has("--unlink");

const now = new Date();
const periodStart = now.toISOString();
const renewalDate =
  arg("--renewal") ??
  new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();

const TIER_ALLOTMENTS: Record<string, number> = {
  starter: 50,
  pro: 250,
  enterprise: 1000,
};
const monthlyAllotment = TIER_ALLOTMENTS[tier] ?? 0;
const monthlyCredits = Number(
  arg("--monthly-credits", String(monthlyAllotment)),
);
const addonCredits = Number(arg("--addon-credits", "0"));

if (!email || !product || !portalId) {
  console.error("Missing required flags. Run with --help.");
  process.exit(1);
}
if (!["property-pulse", "debrief"].includes(product)) {
  console.error(`Invalid --product: ${product}`);
  process.exit(1);
}

// --------------------------------------------------------------------------
// Redis client
// --------------------------------------------------------------------------
const url = process.env.KV_REST_API_URL ?? process.env.REDIS_URL;
const token = process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error(
    "KV_REST_API_URL and KV_REST_API_TOKEN must be set in the environment " +
      "(copy them from Vercel or your Upstash console into .env.local).",
  );
  process.exit(1);
}
const redis = new Redis({ url, token });

const KEY = {
  account: (id: string) => `dunamis:account:${id}`,
  emailIndex: (e: string) => `dunamis:email-to-account:${e.toLowerCase()}`,
  entitlement: (p: string, pid: string) => `dunamis:entitlement:${p}:${pid}`,
  accountEntitlements: (id: string) => `dunamis:account-entitlements:${id}`,
  stripeCustomerToAccount: (customerId: string) =>
    `dunamis:stripe-customer-to-account:${customerId}`,
};

// --------------------------------------------------------------------------
// Seed
// --------------------------------------------------------------------------
(async () => {
  const accountId = (await redis.get<string>(KEY.emailIndex(email))) ?? null;
  if (!accountId) {
    console.error(
      `No account found for ${email}. Sign up at /signup first, then re-run.`,
    );
    process.exit(1);
  }

  const existingKey = KEY.entitlement(product, portalId);
  const existing = await redis.get<{
    entitlementId?: string;
    stripeCustomerId?: string | null;
  }>(existingKey);

  if (unlink) {
    if (existing) {
      // Cascade: if this entitlement owned a Stripe Customer, drop its
      // reverse index so a later re-seed (or a webhook for a now-dead
      // customer) can't resolve back to an orphaned accountId.
      const customerId = existing.stripeCustomerId ?? null;
      if (customerId) {
        await redis.del(KEY.stripeCustomerToAccount(customerId));
        console.log(
          `  removed reverse index stripe-customer-to-account:${customerId}`,
        );
      }
      await redis.srem(
        KEY.accountEntitlements(accountId),
        `${product}::${portalId}`,
      );
      await redis.del(existingKey);
      console.log(`Unlinked ${product}:${portalId} from ${email}.`);
    } else {
      console.log(
        `Nothing to unlink; entitlement ${product}:${portalId} does not exist.`,
      );
    }
    return;
  }

  const credits =
    product === "debrief"
      ? {
          monthly: Number.isFinite(monthlyCredits) ? monthlyCredits : 0,
          monthlyAllotment,
          addon: Number.isFinite(addonCredits) ? addonCredits : 0,
          currentPeriodStart: periodStart,
          currentPeriodEnd: renewalDate,
          firstMonthBonusGranted: false,
        }
      : null;

  const entitlement = {
    entitlementId: existing?.entitlementId ?? randomUUID(),
    accountId,
    product,
    portalId,
    portalDomain,
    installerEmail,
    status,
    tier,
    credits,
    createdAt: periodStart,
    renewalDate,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionHistory: [],
    cancelAtPeriodEnd: false,
  };

  await redis.set(existingKey, entitlement);
  await redis.sadd(
    KEY.accountEntitlements(accountId),
    `${product}::${portalId}`,
  );

  console.log("Seeded entitlement:");
  console.log(JSON.stringify(entitlement, null, 2));
  console.log(`\nLinked to account ${email} (${accountId}).`);
  console.log(`\nOpen: /account/${product}/${portalId}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
