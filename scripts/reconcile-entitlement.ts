/**
 * reconcile-entitlement.ts
 *
 * One-shot repair for an entitlement whose Redis state has drifted from
 * its real Stripe subscription. Lists every subscription on the
 * customer, picks the most-recent active/trialing/past_due one as the
 * authoritative current, and rewrites the entitlement's tier / credits /
 * status / renewal to match.
 *
 * Usage:
 *   npm run reconcile:entitlement -- --portal-id 99990001 --product debrief
 *   npm run reconcile:entitlement -- --portal-id 99990001 --product debrief --dry-run
 */

import "dotenv/config";
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: false });

import Stripe from "stripe";
import { Redis } from "@upstash/redis";

// --------------------------------------------------------------------------
// CLI parsing
// --------------------------------------------------------------------------
const argv = process.argv.slice(2);
function arg(flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
}
function has(flag: string): boolean {
  return argv.includes(flag);
}
if (has("--help") || has("-h")) {
  console.log(`
reconcile-entitlement — rewrite entitlement state from Stripe

Required:
  --portal-id <id>         Portal id to reconcile
  --product <slug>         debrief | property-pulse (only debrief uses Stripe)

Optional:
  --dry-run                Print the before/after diff without writing
  --help, -h               Show this message
`);
  process.exit(0);
}

const portalId = arg("--portal-id");
const product = arg("--product") ?? "debrief";
const dryRun = has("--dry-run");

if (!portalId) {
  console.error("--portal-id is required. Run with --help.");
  process.exit(1);
}
if (product !== "debrief" && product !== "property-pulse") {
  console.error(`--product must be 'debrief' or 'property-pulse'.`);
  process.exit(1);
}
if (product !== "debrief") {
  console.error("Only debrief entitlements have Stripe state to reconcile.");
  process.exit(1);
}

// --------------------------------------------------------------------------
// Clients
// --------------------------------------------------------------------------
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("STRIPE_SECRET_KEY is not set.");
  process.exit(1);
}
const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-03-25.dahlia",
  appInfo: { name: "dunamis-studios-web/reconcile" },
});

const kvUrl = process.env.KV_REST_API_URL ?? process.env.REDIS_URL;
const kvToken = process.env.KV_REST_API_TOKEN;
if (!kvUrl || !kvToken) {
  console.error("KV_REST_API_URL / KV_REST_API_TOKEN missing.");
  process.exit(1);
}
const redis = new Redis({ url: kvUrl, token: kvToken });

// --------------------------------------------------------------------------
// Types + pricing (duplicated here to keep the script standalone — the
// app's real types.ts / pricing.ts evolve and scripts shouldn't chase)
// --------------------------------------------------------------------------
type Tier = "starter" | "pro" | "enterprise";
const TIER_ALLOTMENTS: Record<Tier, number> = {
  starter: 50,
  pro: 250,
  enterprise: 1000,
};
const PRICE_ENV_TO_TIER: Record<string, Tier> = {
  STRIPE_PRICE_DEBRIEF_STARTER_MONTHLY: "starter",
  STRIPE_PRICE_DEBRIEF_PRO_MONTHLY: "pro",
  STRIPE_PRICE_DEBRIEF_ENTERPRISE_MONTHLY: "enterprise",
};

function tierFromPriceId(priceId: string | null): Tier | null {
  if (!priceId) return null;
  for (const [envKey, tier] of Object.entries(PRICE_ENV_TO_TIER)) {
    if (process.env[envKey] === priceId) return tier;
  }
  return null;
}

function tierFromSubscription(sub: Stripe.Subscription): Tier | null {
  const metaTier = sub.metadata?.tier;
  if (metaTier === "starter" || metaTier === "pro" || metaTier === "enterprise") {
    return metaTier;
  }
  return tierFromPriceId(sub.items.data[0]?.price.id ?? null);
}

function toIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function periodFromSubscription(sub: Stripe.Subscription): {
  start: number;
  end: number;
} {
  const item = sub.items.data[0];
  const anySub = sub as unknown as Record<string, number | undefined>;
  const start =
    item?.current_period_start ??
    anySub.current_period_start ??
    Math.floor(Date.now() / 1000);
  const end =
    item?.current_period_end ??
    anySub.current_period_end ??
    start + 30 * 24 * 3600;
  return { start, end };
}

function mapStatus(
  s: Stripe.Subscription.Status,
): "trial" | "active" | "incomplete" | "past_due" | "canceled" {
  switch (s) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "incomplete":
      return "incomplete";
    default:
      return "trial";
  }
}

// --------------------------------------------------------------------------
// Run
// --------------------------------------------------------------------------
(async () => {
  const entitlementKey = `dunamis:entitlement:${product}:${portalId}`;
  const before = await redis.get<Record<string, unknown>>(entitlementKey);
  if (!before) {
    console.error(`No entitlement found at ${entitlementKey}.`);
    process.exit(1);
  }

  let customerId =
    typeof before.stripeCustomerId === "string"
      ? before.stripeCustomerId
      : null;

  // If the entitlement lost its stripeCustomerId, recover it by
  // inspecting the subscription history on Stripe. Any historical
  // subscription id resolves to the same customer.
  if (!customerId) {
    const historyFallback = Array.isArray(before.subscriptionHistory)
      ? (before.subscriptionHistory as string[])
      : [];
    const lastKnownSub =
      typeof before.stripeSubscriptionId === "string"
        ? before.stripeSubscriptionId
        : null;
    const candidates = [
      ...(lastKnownSub ? [lastKnownSub] : []),
      ...historyFallback.slice().reverse(),
    ];
    for (const subId of candidates) {
      try {
        const sub = await stripe.subscriptions.retrieve(subId);
        const c =
          typeof sub.customer === "string"
            ? sub.customer
            : sub.customer.id;
        console.log(
          `Recovered customerId=${c} from historical subscription ${subId}.`,
        );
        customerId = c;
        break;
      } catch {
        // Try the next historical id.
      }
    }
  }

  if (!customerId) {
    console.error(
      `No stripeCustomerId on the entitlement and no recoverable sub in history — nothing to reconcile.`,
    );
    process.exit(1);
  }

  console.log(`Reconciling ${product}:${portalId} (customer=${customerId})…`);

  // List every subscription on the customer. Stripe returns
  // newest-first by default.
  const allSubs: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;
  for (;;) {
    const resp = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
      starting_after: startingAfter,
    });
    allSubs.push(...resp.data);
    if (!resp.has_more || resp.data.length === 0) break;
    startingAfter = resp.data[resp.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  console.log(`Found ${allSubs.length} total subscription(s):`);
  for (const s of allSubs) {
    console.log(
      `  - ${s.id} status=${s.status} tier=${tierFromSubscription(s) ?? "?"}`,
    );
  }

  // Live tiers first, most recent first (Stripe already returns
  // newest-first, so we preserve order).
  const LIVE: Stripe.Subscription.Status[] = [
    "active",
    "trialing",
    "past_due",
  ];
  const liveSubs = allSubs.filter((s) => LIVE.includes(s.status));
  const currentSub = liveSubs[0] ?? allSubs[0] ?? null;

  if (!currentSub) {
    console.error("No subscriptions on customer — nothing to reconcile to.");
    process.exit(1);
  }

  console.log(`Selected current: ${currentSub.id} (${currentSub.status}).`);

  const tier = tierFromSubscription(currentSub);
  if (!tier) {
    console.error(`Could not resolve tier for ${currentSub.id}.`);
    process.exit(1);
  }
  const allotment = TIER_ALLOTMENTS[tier];
  const { start, end } = periodFromSubscription(currentSub);

  // Merge subscriptionHistory: existing + every sub id on the customer.
  const priorHistory = Array.isArray(before.subscriptionHistory)
    ? (before.subscriptionHistory as string[])
    : [];
  const merged = [...priorHistory];
  for (const s of allSubs) {
    if (!merged.includes(s.id)) merged.push(s.id);
  }
  if (!merged.includes(currentSub.id)) merged.push(currentSub.id);

  // Credits — preserve addon bucket. Clamp monthly to min(current, new
  // allotment) so a stale high balance on a lower tier doesn't persist.
  const priorCredits =
    typeof before.credits === "object" && before.credits !== null
      ? (before.credits as {
          monthly?: number;
          monthlyAllotment?: number;
          addon?: number;
          currentPeriodStart?: string;
          currentPeriodEnd?: string;
          firstMonthBonusGranted?: boolean;
        })
      : null;
  const priorMonthly = priorCredits?.monthly ?? 0;
  const clampedMonthly = Math.min(priorMonthly, allotment);

  const after = {
    ...before,
    status: mapStatus(currentSub.status),
    tier,
    stripeSubscriptionId: currentSub.id,
    stripeCustomerId: customerId,
    subscriptionHistory: merged,
    renewalDate: toIso(end),
    cancelAtPeriodEnd: currentSub.cancel_at_period_end ?? false,
    credits: {
      monthly: clampedMonthly,
      monthlyAllotment: allotment,
      addon: priorCredits?.addon ?? 0,
      currentPeriodStart: toIso(start) ?? new Date().toISOString(),
      currentPeriodEnd:
        toIso(end) ?? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      firstMonthBonusGranted: priorCredits?.firstMonthBonusGranted ?? true,
    },
  };

  console.log("\n--- BEFORE ---");
  console.log(JSON.stringify(before, null, 2));
  console.log("\n--- AFTER ---");
  console.log(JSON.stringify(after, null, 2));

  if (dryRun) {
    console.log("\n(dry-run: not written)");
    return;
  }

  await redis.set(entitlementKey, after);
  console.log(`\nWrote ${entitlementKey}.`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
