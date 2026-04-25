import type { EntitlementTier } from "./types";

/**
 * Single source of truth for Debrief pricing on the website.
 * Price IDs are pulled from env vars that mirror the canonical list
 * in the debrief repo's docs/stripe-integration-test.md.
 */

// ---------------------------------------------------------------------------
// Subscription tiers
// ---------------------------------------------------------------------------

interface TierSpec {
  tier: EntitlementTier;
  label: string;
  description: string;
  monthlyDollars: number;
  monthlyAllotment: number;
  firstMonthBonus: number;
  /** Pretty list of what this tier unlocks — mirrors /pricing. */
  features: string[];
}

export const DEBRIEF_TIERS: Record<EntitlementTier, TierSpec> = {
  starter: {
    tier: "starter",
    label: "Starter",
    description: "Standard objects, 30 days of history, the core handoff flow.",
    monthlyDollars: 19,
    monthlyAllotment: 50,
    firstMonthBonus: 100,
    features: [
      "50 credits / month · 100 your first month",
      "Standard objects: contacts, companies, deals, tickets",
      "Draft Brief + atomic Handoff modes",
      "30-day Handoff Log and Brief Search",
      "Email support",
    ],
  },
  pro: {
    tier: "pro",
    label: "Pro",
    description: "Custom objects, deeper context, real team rollout.",
    monthlyDollars: 49,
    monthlyAllotment: 250,
    firstMonthBonus: 500,
    features: [
      "250 credits / month · 500 your first month",
      "Custom object briefs",
      "Engagement fan-out on standard associations",
      "Custom object associations (read-only)",
      "Primary record property override",
      "90-day Handoff Log and Brief Search",
      "Priority support",
    ],
  },
  enterprise: {
    tier: "enterprise",
    label: "Enterprise",
    description: "Full depth, full history, custom tuning.",
    monthlyDollars: 149,
    monthlyAllotment: 1000,
    firstMonthBonus: 2000,
    features: [
      "1,000 credits / month · 2,000 your first month",
      "Engagement fan-out on custom object associations",
      "Full custom object associations",
      "365-day Handoff Log · unlimited Brief Search",
      "Custom prompt tuning",
      "Dedicated support",
    ],
  },
};

export const DEBRIEF_TIER_ORDER: EntitlementTier[] = [
  "starter",
  "pro",
  "enterprise",
];

/** Stripe recurring-price ID for a Debrief tier (monthly cadence only). */
export function getPriceId(tier: EntitlementTier): string {
  const envKey = `STRIPE_PRICE_DEBRIEF_${tier.toUpperCase()}_MONTHLY`;
  const id = process.env[envKey];
  if (!id) {
    throw new Error(`Missing env var ${envKey} for Debrief ${tier} price.`);
  }
  return id;
}

export function getTierByPriceId(
  priceId: string,
): EntitlementTier | null {
  for (const t of DEBRIEF_TIER_ORDER) {
    try {
      if (getPriceId(t) === priceId) return t;
    } catch {
      /* ignore missing envs — only match the ones that are configured */
    }
  }
  return null;
}

export function getTierAllotment(tier: EntitlementTier): number {
  return DEBRIEF_TIERS[tier].monthlyAllotment;
}

/**
 * Canonical Debrief tier feature list. Same data the /pricing page and
 * the subscribe modal render, surfaced here so the Current plan card on
 * the entitlement detail page stays in lockstep instead of drifting its
 * own fabricated copy.
 */
export function getTierFeatures(tier: EntitlementTier): string[] {
  return DEBRIEF_TIERS[tier].features;
}

export function getFirstMonthBonus(tier: EntitlementTier): number {
  return DEBRIEF_TIERS[tier].firstMonthBonus;
}

// ---------------------------------------------------------------------------
// Credit packs (one-time purchases)
// ---------------------------------------------------------------------------

export type CreditPackName = "small" | "medium" | "large" | "bulk";

export interface CreditPack {
  name: CreditPackName;
  label: string;
  credits: number;
  dollars: number;
  /** Amount in cents, for Stripe PaymentIntent.amount. */
  amountCents: number;
  /** Effective per-credit rate in dollars. */
  effectiveRate: number;
  /** Percentage discount vs Small base rate. null = base rate. */
  discountPercent: number | null;
  priceIdEnvKey: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    name: "small",
    label: "Small",
    credits: 100,
    dollars: 25,
    amountCents: 2500,
    effectiveRate: 0.25,
    discountPercent: null,
    priceIdEnvKey: "STRIPE_PRICE_DEBRIEF_CREDITS_SMALL_100",
  },
  {
    name: "medium",
    label: "Medium",
    credits: 500,
    dollars: 100,
    amountCents: 10000,
    effectiveRate: 0.2,
    discountPercent: 20,
    priceIdEnvKey: "STRIPE_PRICE_DEBRIEF_CREDITS_MEDIUM_500",
  },
  {
    name: "large",
    label: "Large",
    credits: 2000,
    dollars: 350,
    amountCents: 35000,
    effectiveRate: 0.175,
    discountPercent: 30,
    priceIdEnvKey: "STRIPE_PRICE_DEBRIEF_CREDITS_LARGE_2000",
  },
  {
    name: "bulk",
    label: "Bulk",
    credits: 10000,
    dollars: 1500,
    amountCents: 150000,
    effectiveRate: 0.15,
    discountPercent: 40,
    priceIdEnvKey: "STRIPE_PRICE_DEBRIEF_CREDITS_BULK_10000",
  },
];

export function getCreditPack(name: CreditPackName): CreditPack {
  const pack = CREDIT_PACKS.find((p) => p.name === name);
  if (!pack) throw new Error(`Unknown credit pack: ${name}`);
  return pack;
}

/** Stripe Price ID for a credit pack (one-time). */
export function getCreditPackPriceId(name: CreditPackName): string {
  const pack = getCreditPack(name);
  const id = process.env[pack.priceIdEnvKey];
  if (!id) {
    throw new Error(`Missing env var ${pack.priceIdEnvKey} for credit pack.`);
  }
  return id;
}

// ---------------------------------------------------------------------------
// Property Pulse — flat one-time license
// ---------------------------------------------------------------------------

export const PROPERTY_PULSE_LICENSE_CENTS = 4900;
export const PROPERTY_PULSE_LICENSE_DOLLARS = 49;

/** Stripe Price ID for the Property Pulse one-time license ($49 per portal). */
export function getPropertyPulseLicensePriceId(): string {
  const id = process.env.STRIPE_PRICE_PROPERTY_PULSE_LICENSE;
  if (!id) {
    throw new Error(
      "Missing env var STRIPE_PRICE_PROPERTY_PULSE_LICENSE for PP license price.",
    );
  }
  return id;
}

// ---------------------------------------------------------------------------
// Credit cost table (per handoff, by input tokens)
//
// Source: the Credit Model spec in the Stripe wiring prompt. Consumption
// logic lives in the Debrief app — we only display this table here so the
// pricing page and any future UI can read a single authoritative source.
// ---------------------------------------------------------------------------

export interface CreditCostBand {
  from: number;
  to: number | null; // null = open-ended
  credits: number | "block";
  /** Used for "+X per additional 40k block, no cap" row. */
  blockSize?: number;
}

export const CREDIT_COST_TABLE: CreditCostBand[] = [
  { from: 0, to: 8000, credits: 1 },
  { from: 8001, to: 20000, credits: 2 },
  { from: 20001, to: 50000, credits: 4 },
  { from: 50001, to: 80000, credits: 8 },
  { from: 80001, to: 120000, credits: 12 },
  { from: 120001, to: 160000, credits: 16 },
  { from: 160001, to: null, credits: "block", blockSize: 40000 },
];
