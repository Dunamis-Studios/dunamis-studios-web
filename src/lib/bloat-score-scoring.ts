/**
 * Pure scoring logic for the /tools/hubspot-bloat-score surface.
 * No side effects, no I/O. Imported by both the client component (live
 * preview) and the API route (canonical score saved to Redis and
 * mailed in the report).
 *
 * Benchmarks split cleanly into three groups:
 *   1. HubSpot product limits (custom property caps, workflow caps,
 *      list caps). Verified against HubSpot's published product limits
 *      docs and inline-cited in the methodology copy.
 *   2. Industry observations from Vantage Point (300 to 500+ properties
 *      accumulating within 2 years; 30 to 40 percent of properties
 *      actively used in mid-size portals).
 *   3. Dunamis model assumptions, labelled as such: per-age "healthy"
 *      property counts and the 40/25/20/15 weight split across
 *      properties / workflows / lists / density.
 */

export type Tier = "free" | "starter" | "pro" | "enterprise";
export type PortalAge = "under_1" | "1_3" | "3_5" | "5_plus";

export type BloatTier = "Lean" | "Healthy" | "Bloated" | "Critical";

export interface BloatInputs {
  contactProperties: number;
  companyProperties: number;
  dealProperties: number;
  activeWorkflows: number;
  activeLists: number;
  totalContacts: number;
  portalAge: PortalAge;
  tier: Tier;
}

export type CategoryId = "properties" | "workflows" | "lists" | "density";
export type CategoryStatus = "lean" | "on" | "heavy" | "critical";

export interface CategoryBreakdown {
  id: CategoryId;
  label: string;
  /** Human-readable current value (e.g., "240 custom properties"). */
  current: string;
  /** Human-readable benchmark (e.g., "Healthy ceiling around 150 for 1 to 3 year portals"). */
  benchmark: string;
  status: CategoryStatus;
  /** Subscore 0 to 100 within this category. */
  subscore: number;
  /** Weight 0 to 1 applied when summing into the total. */
  weight: number;
  /** subscore * weight, units of total-score points. */
  contribution: number;
}

export interface TopConcentration {
  categoryId: CategoryId;
  title: string;
  body: string;
}

export interface BloatResults {
  /** 0 to 100. Higher is more bloated. */
  totalScore: number;
  tier: BloatTier;
  tierBlurb: string;
  breakdown: CategoryBreakdown[];
  topConcentrations: TopConcentration[];
}

// ----------------------------------------------------------------- benchmarks

/**
 * Dunamis model assumption: a "healthy" custom property count by
 * portal age, summed across contact + company + deal objects. Tuned
 * against Vantage Point's observation that mid-size portals accumulate
 * 300 to 500+ properties within 2 years; we slot the bend points so
 * that crossing 1.0 ratio at the 1-3 year mark hits 150, which is
 * meaningfully under Vantage Point's drift trajectory.
 */
const PROPERTY_AGE_BENCHMARK: Record<PortalAge, number> = {
  under_1: 50,
  "1_3": 150,
  "3_5": 300,
  "5_plus": 400,
};

/**
 * Free tier custom property cap is a hard HubSpot product limit:
 * 10 total across all objects combined. Override the age benchmark
 * for Free portals because the platform itself enforces a much
 * lower ceiling than a model assumption could.
 */
const FREE_TIER_PROPERTY_LIMIT = 10;

/**
 * Workflow ceilings drawn from HubSpot's published per-tier limits.
 * The Free row reflects that workflow tooling is essentially absent
 * on Free; we use a small non-zero number so the ratio math does not
 * divide by zero. Real-world callers on Free with non-trivial
 * workflow counts are using something the tier does not formally
 * support, which is itself worth flagging as bloat risk.
 */
const WORKFLOW_TIER_CEILING: Record<Tier, number> = {
  free: 5,
  starter: 25,
  pro: 300,
  enterprise: 1000,
};

/**
 * Active list ceilings from HubSpot's Marketing Hub published limits.
 * Free maps to the Starter ceiling because Free does not publish a
 * separate list cap; Starter's 25 active is the practical limit.
 */
const LIST_TIER_CEILING: Record<Tier, number> = {
  free: 25,
  starter: 25,
  pro: 1000,
  enterprise: 1500,
};

// ----------------------------------------------------------------- scoring

function scoreRatio(
  ratio: number,
  bands: { lean: number; healthy: number; critical: number },
): { subscore: number; status: CategoryStatus } {
  if (ratio <= bands.lean) return { subscore: 0, status: "lean" };
  if (ratio <= bands.healthy) return { subscore: 0, status: "on" };
  if (ratio < bands.critical) {
    // Linear scale from healthy (0) to critical-edge (100).
    const span = bands.critical - bands.healthy;
    const into = ratio - bands.healthy;
    const sub = Math.min(100, Math.max(0, (into / span) * 100));
    return { subscore: sub, status: "heavy" };
  }
  return { subscore: 100, status: "critical" };
}

function scoreProperties(inputs: BloatInputs): CategoryBreakdown {
  const total =
    inputs.contactProperties +
    inputs.companyProperties +
    inputs.dealProperties;
  const benchmark =
    inputs.tier === "free"
      ? FREE_TIER_PROPERTY_LIMIT
      : PROPERTY_AGE_BENCHMARK[inputs.portalAge];
  const ratio = benchmark > 0 ? total / benchmark : 0;
  const { subscore, status } = scoreRatio(ratio, {
    lean: 0.7,
    healthy: 1.0,
    critical: 2.0,
  });
  const ageLabel = AGE_LABEL[inputs.portalAge];
  const benchmarkText =
    inputs.tier === "free"
      ? `HubSpot Free tier hard cap of ${FREE_TIER_PROPERTY_LIMIT} total custom properties`
      : `Healthy ceiling around ${benchmark} for ${ageLabel} portals`;
  return {
    id: "properties",
    label: "Custom properties",
    current: `${total.toLocaleString("en-US")} total (${inputs.contactProperties} contact, ${inputs.companyProperties} company, ${inputs.dealProperties} deal)`,
    benchmark: benchmarkText,
    status,
    subscore,
    weight: 0.4,
    contribution: subscore * 0.4,
  };
}

function scoreWorkflows(inputs: BloatInputs): CategoryBreakdown {
  const ceiling = WORKFLOW_TIER_CEILING[inputs.tier];
  const ratio = ceiling > 0 ? inputs.activeWorkflows / ceiling : 0;
  const { subscore, status } = scoreRatio(ratio, {
    lean: 0.3,
    healthy: 0.7,
    critical: 1.0,
  });
  return {
    id: "workflows",
    label: "Active workflows",
    current: `${inputs.activeWorkflows.toLocaleString("en-US")} active`,
    benchmark: `${ceiling.toLocaleString("en-US")} per-tier ceiling on ${TIER_LABEL[inputs.tier]}`,
    status,
    subscore,
    weight: 0.25,
    contribution: subscore * 0.25,
  };
}

function scoreLists(inputs: BloatInputs): CategoryBreakdown {
  const ceiling = LIST_TIER_CEILING[inputs.tier];
  const ratio = ceiling > 0 ? inputs.activeLists / ceiling : 0;
  const { subscore, status } = scoreRatio(ratio, {
    lean: 0.3,
    healthy: 0.7,
    critical: 1.0,
  });
  return {
    id: "lists",
    label: "Active lists",
    current: `${inputs.activeLists.toLocaleString("en-US")} active`,
    benchmark: `${ceiling.toLocaleString("en-US")} active-list ceiling on ${TIER_LABEL[inputs.tier]}`,
    status,
    subscore,
    weight: 0.2,
    contribution: subscore * 0.2,
  };
}

function scoreDensity(inputs: BloatInputs): CategoryBreakdown {
  const totalProps =
    inputs.contactProperties +
    inputs.companyProperties +
    inputs.dealProperties;
  const totalAssets = totalProps + inputs.activeWorkflows + inputs.activeLists;
  // Floor the denominator so a portal with 0 contacts does not divide
  // to infinity. The floor itself is not meaningful; a 50-contact
  // portal with 200 assets is clearly heavy regardless of whether we
  // call the ratio 4.0 or 2.0.
  const contactsForRatio = Math.max(inputs.totalContacts, 100);
  const assetsPer1000 = (totalAssets / contactsForRatio) * 1000;
  const { subscore, status } = scoreRatio(assetsPer1000, {
    lean: 50,
    healthy: 200,
    critical: 500,
  });
  return {
    id: "density",
    label: "Asset density per 1,000 contacts",
    current: `${Math.round(assetsPer1000).toLocaleString("en-US")} assets per 1,000 contacts (${totalAssets.toLocaleString("en-US")} assets / ${inputs.totalContacts.toLocaleString("en-US")} contacts)`,
    benchmark:
      "Lean under 50, healthy 50 to 200, heavy 200 to 500, critical above 500",
    status,
    subscore,
    weight: 0.15,
    contribution: subscore * 0.15,
  };
}

// ----------------------------------------------------------------- top 3

function buildTopConcentrations(
  breakdown: CategoryBreakdown[],
): TopConcentration[] {
  const sorted = [...breakdown].sort((a, b) => b.contribution - a.contribution);
  return sorted.slice(0, 3).map(toConcentration);
}

function toConcentration(b: CategoryBreakdown): TopConcentration {
  if (b.contribution === 0) {
    return { categoryId: b.id, ...LEAN_NARRATIVE[b.id] };
  }
  if (b.status === "critical") {
    return { categoryId: b.id, ...CRITICAL_NARRATIVE[b.id] };
  }
  return { categoryId: b.id, ...HEAVY_NARRATIVE[b.id] };
}

const LEAN_NARRATIVE: Record<CategoryId, { title: string; body: string }> = {
  properties: {
    title: "Custom property count is within the healthy benchmark",
    body: "Quarterly audits keep the schema lean. Vantage Point reports mid-size portals accumulate 300 to 500+ properties within 2 years if creation goes unmanaged; you are tracking ahead of that drift.",
  },
  workflows: {
    title: "Active workflows are well under the tier ceiling",
    body: "There is room for considered expansion. Watch for one-off automations that outlive their use; archiving deactivated workflows keeps the surface tidy.",
  },
  lists: {
    title: "Active lists are well under the tier ceiling",
    body: "There is room for considered expansion. Campaign and segmentation lists tend to accumulate; periodic conversion of finished one-offs to static or archive keeps the count honest.",
  },
  density: {
    title: "Asset density per contact is healthy",
    body: "Configuration is roughly proportional to the contact base. The portal is doing meaningful work for the records it holds.",
  },
};

const HEAVY_NARRATIVE: Record<CategoryId, { title: string; body: string }> = {
  properties: {
    title: "Custom property count is the largest concentration of bloat",
    body: "Vantage Point observes only 30 to 40 percent of custom properties are actively used in mid-size portals. The slack between current count and active use is where audits pay off. Archive properties under 5 percent fill rate and with no \"Used in\" references.",
  },
  workflows: {
    title: "Active workflow count is heavier than the tier supports cleanly",
    body: "Workflows fire on conditions that change with time, and inherited automations rarely get audited. Look for duplicates across teams (sales and CS often build parallel automations) and for workflows whose trigger conditions no longer happen.",
  },
  lists: {
    title: "Active list count is heavier than the tier supports cleanly",
    body: "Most portals accumulate one-off campaign lists that outlive their use. Static-list conversion or archive on lists older than 90 days that are not referenced by an active workflow drops the active count fast.",
  },
  density: {
    title: "Asset density per contact is high",
    body: "Either the contact base is small relative to the configured infrastructure, or the configuration has expanded beyond what a portal of this size needs. The fix is auditing assets, not loading more contacts.",
  },
};

const CRITICAL_NARRATIVE: Record<CategoryId, { title: string; body: string }> = {
  properties: {
    title: "Custom property count is at or above the platform ceiling",
    body: "HubSpot blocks property creation around 1,100 per object in real-world reports. At this point new fields cannot ship until old fields are archived. Archive aggressively starting from properties with under 5 percent fill rate, no references, and no recent writes.",
  },
  workflows: {
    title: "Active workflows are at or above the tier ceiling",
    body: "New workflows cannot be activated until existing ones are deactivated. The audit pass needed here is bigger than a single sitting; budget a multi-week cleanup with explicit owners.",
  },
  lists: {
    title: "Active lists are at or above the tier ceiling",
    body: "New active lists cannot be created until existing ones are converted to static or archived. Start with marketing campaign lists older than 90 days; most should be static or gone.",
  },
  density: {
    title: "Asset density per contact is critical",
    body: "The portal is heavily configured relative to the contact volume it serves. This is normal during early build-out but accumulates risk over time as orphaned assets pile up.",
  },
};

// ----------------------------------------------------------------- public

export function scoreBloat_(inputs: BloatInputs): BloatResults {
  const breakdown: CategoryBreakdown[] = [
    scoreProperties(inputs),
    scoreWorkflows(inputs),
    scoreLists(inputs),
    scoreDensity(inputs),
  ];
  const totalScore = Math.round(
    breakdown.reduce((acc, b) => acc + b.contribution, 0),
  );
  const tier = bloatTierFor(totalScore);
  const tierBlurb = TIER_BLURBS[tier];
  const topConcentrations = buildTopConcentrations(breakdown);
  return { totalScore, tier, tierBlurb, breakdown, topConcentrations };
}

function bloatTierFor(score: number): BloatTier {
  if (score <= 25) return "Lean";
  if (score <= 50) return "Healthy";
  if (score <= 75) return "Bloated";
  return "Critical";
}

const TIER_BLURBS: Record<BloatTier, string> = {
  Lean: "The portal is lean relative to its tier and age. Maintain the cadence and bloat stays low.",
  Healthy:
    "The portal is healthy. Some categories are accumulating; routine audits keep them in check.",
  Bloated:
    "Bloat is real. One or more categories are heavy enough to slow new work and put existing reports at risk.",
  Critical:
    "Active risk to platform health. Tier ceilings are close or breached; new builds will start failing until cleanup happens.",
};

// ----------------------------------------------------------------- labels

export const AGE_LABEL: Record<PortalAge, string> = {
  under_1: "under 1 year",
  "1_3": "1 to 3 year",
  "3_5": "3 to 5 year",
  "5_plus": "5+ year",
};

export const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};
