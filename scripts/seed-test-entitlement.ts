/**
 * Seed a fake entitlement into Redis and link it to an existing Dunamis
 * Studios account by email.
 *
 * Usage (loads .env.local automatically):
 *   npm run seed:entitlement -- \
 *     --email you@example.com \
 *     --product property-pulse \
 *     --portal-id 12345678 \
 *     --domain acme.com \
 *     --status active \
 *     --tier pro \
 *     --credits 1200
 *
 * Re-running with the same product + portal-id updates the existing record
 * rather than creating a duplicate.
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
  --credits <n>            Default: 1000
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
const status = (arg("--status", "active") as
  | "trial"
  | "active"
  | "past_due"
  | "canceled");
const tier = (arg("--tier", "pro") as "starter" | "pro" | "enterprise");
const credits = Number(arg("--credits", "1000"));
const renewalDate =
  arg("--renewal") ??
  new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
const unlink = has("--unlink");

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
  const existing = await redis.get<{ entitlementId?: string }>(existingKey);

  if (unlink) {
    if (existing) {
      await redis.srem(
        KEY.accountEntitlements(accountId),
        `${product}::${portalId}`,
      );
      await redis.del(existingKey);
      console.log(`Unlinked ${product}:${portalId} from ${email}.`);
    } else {
      console.log(`Nothing to unlink; entitlement ${product}:${portalId} does not exist.`);
    }
    return;
  }

  const entitlement = {
    entitlementId: existing?.entitlementId ?? randomUUID(),
    accountId,
    product,
    portalId,
    portalDomain,
    installerEmail,
    status,
    tier,
    credits: Number.isFinite(credits) ? credits : null,
    createdAt: new Date().toISOString(),
    renewalDate,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
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
