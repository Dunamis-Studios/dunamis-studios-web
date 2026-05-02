/**
 * Pure recommendation logic for /tools/lead-scoring-builder.
 * No side effects, no I/O. Imported by the client component (live
 * preview) and the API route (canonical model saved to Redis and
 * mailed in the report).
 *
 * Outputs a starter HubSpot lead-scoring model the visitor can take
 * directly into Marketing > Lead Scoring. Values come from three
 * sources: HubSpot product limits and recommendations, industry-
 * standard point values, and a small set of cycle-driven adjustments
 * labelled as Dunamis model assumptions.
 */

export type BuyerRole = "vp_c" | "director_manager" | "ic" | "mixed";
export type CompanySize = "under_50" | "50_250" | "250_1000" | "1000_plus";
export type CycleLength = "under_30" | "30_90" | "90_180" | "180_plus";
export type Tier = "pro" | "enterprise";

export type HighIntentAction =
  | "pricing_visit"
  | "demo_request"
  | "contact_form"
  | "free_trial"
  | "content_download"
  | "multi_page_session"
  | "return_visit_7d";

export type Disqualifier =
  | "free_email"
  | "role_mismatch"
  | "size_mismatch"
  | "competitor_domain"
  | "geo_mismatch";

export interface LeadScoringInputs {
  buyerRole: BuyerRole;
  companySize: CompanySize;
  cycleLength: CycleLength;
  highIntentActions: HighIntentAction[];
  disqualifiers: Disqualifier[];
  tier: Tier;
}

export interface ScoringRule {
  /** Human-readable rule name as it would appear in HubSpot. */
  name: string;
  /** Point value, positive or negative, in the cap-appropriate scale. */
  points: number;
  /** One-line description for the report. */
  description: string;
}

export interface TierMapping {
  letter: "A" | "B" | "C";
  label: string;
  range: string;
  description: string;
}

export interface LeadScoringResults {
  /** 100 for Pro, 500 for Enterprise. */
  scoreCap: number;
  /** MQL threshold scaled to the cap. */
  mqlThreshold: number;
  /** Fit / Engagement split as percentages summing to 100. */
  split: { fit: number; engagement: number };
  /** Decay period in days. */
  decayDays: number;
  /** Decay rate description for HubSpot's scoring config. */
  decayRate: string;
  /** Recommended fit rules (firmographic). */
  fitRules: ScoringRule[];
  /** Recommended positive engagement rules. */
  engagementRules: ScoringRule[];
  /** Recommended negative rules. */
  negativeRules: ScoringRule[];
  /** A / B / C tier ranges. */
  tiers: TierMapping[];
}

// ----------------------------------------------------------------- defs

const BASE_INTENT: Record<
  HighIntentAction,
  { name: string; points: number; description: string }
> = {
  demo_request: {
    name: "Demo request",
    points: 25,
    description: "Award when the contact submits a demo request form.",
  },
  free_trial: {
    name: "Free trial signup",
    points: 25,
    description: "Award when the contact signs up for a free trial.",
  },
  contact_form: {
    name: "Contact form submission",
    points: 20,
    description: "Award on any contact form submission.",
  },
  pricing_visit: {
    name: "Pricing page visit",
    points: 15,
    description: "Award when the contact views your pricing page.",
  },
  return_visit_7d: {
    name: "Return visit within 7 days",
    points: 10,
    description: "Award on a second site visit within 7 days of the first.",
  },
  content_download: {
    name: "Content download",
    points: 5,
    description:
      "Award per ebook, whitepaper, or gated asset download.",
  },
  multi_page_session: {
    name: "Multi-page session (3+ pages)",
    points: 5,
    description:
      "Award when the contact views three or more pages in a single session.",
  },
};

const BASE_DISQ: Record<
  Disqualifier,
  { name: string; points: number; description: string }
> = {
  competitor_domain: {
    name: "Competitor email domain",
    points: -50,
    description:
      "Subtract when the contact's email domain matches a known competitor.",
  },
  role_mismatch: {
    name: "Role mismatch",
    points: -25,
    description:
      "Subtract when job title is outside your target buyer profile.",
  },
  size_mismatch: {
    name: "Company size mismatch",
    points: -20,
    description:
      "Subtract when the contact's company size is outside your target range.",
  },
  free_email: {
    name: "Free email domain",
    points: -15,
    description:
      "Subtract for free email providers (gmail, yahoo, hotmail, outlook).",
  },
  geo_mismatch: {
    name: "Geography mismatch",
    points: -15,
    description: "Subtract when the contact is in a region you do not serve.",
  },
};

const ROLE_LABEL: Record<BuyerRole, string> = {
  vp_c: "VP / C-Suite",
  director_manager: "Director / Manager",
  ic: "Individual Contributor",
  mixed: "Mixed seniority",
};

const SIZE_LABEL: Record<CompanySize, string> = {
  under_50: "under 50 employees",
  "50_250": "50 to 250 employees",
  "250_1000": "250 to 1,000 employees",
  "1000_plus": "1,000+ employees",
};

const CYCLE_LABEL: Record<CycleLength, string> = {
  under_30: "under 30 days",
  "30_90": "30 to 90 days",
  "90_180": "90 to 180 days",
  "180_plus": "180+ days",
};

const TIER_LABEL: Record<Tier, string> = {
  pro: "Marketing Pro",
  enterprise: "Marketing Enterprise",
};

// ----------------------------------------------------------------- adjustments

/**
 * Dunamis model assumption: MQL threshold scales with cycle length.
 * Shorter cycles can clear faster on lighter signals; longer cycles
 * need more accumulated evidence before sales handoff. Threshold is
 * expressed on the Pro 100-point scale and gets scaled by the tier
 * multiplier downstream.
 */
const PRO_THRESHOLD: Record<CycleLength, number> = {
  under_30: 60,
  "30_90": 70,
  "90_180": 75,
  "180_plus": 80,
};

/**
 * Dunamis model assumption: fit-versus-engagement split shifts with
 * cycle length. Short cycles weight engagement more (transactional
 * buying); long cycles weight fit more (considered enterprise sales).
 * Anchored at HubSpot's recommended 50/50 default for the median
 * 30-90 day cycle.
 */
const SPLIT: Record<CycleLength, { fit: number; engagement: number }> = {
  under_30: { fit: 40, engagement: 60 },
  "30_90": { fit: 50, engagement: 50 },
  "90_180": { fit: 55, engagement: 45 },
  "180_plus": { fit: 60, engagement: 40 },
};

/**
 * Dunamis model assumption: decay period scales with cycle length.
 * Shorter cycles cool faster; longer cycles can hold a warm lead for
 * months without a fresh touchpoint without going stale. Capped at
 * 90 days because beyond that, dormant scores create false positives
 * regardless of cycle.
 */
const DECAY_DAYS: Record<CycleLength, number> = {
  under_30: 30,
  "30_90": 60,
  "90_180": 90,
  "180_plus": 90,
};

// ----------------------------------------------------------------- public

export function buildLeadScoringModel(
  inputs: LeadScoringInputs,
): LeadScoringResults {
  const scoreCap = inputs.tier === "enterprise" ? 500 : 100;
  // 5x multiplier on Enterprise so the standard 25/15/10/5 spread
  // scales proportionally into the larger cap. Enterprise users
  // typically extend this baseline with more granular intent rules
  // to use the additional headroom; the methodology copy says so.
  const mult = inputs.tier === "enterprise" ? 5 : 1;

  const baseThreshold = PRO_THRESHOLD[inputs.cycleLength];
  const mqlThreshold = baseThreshold * mult;
  const split = SPLIT[inputs.cycleLength];
  const decayDays = DECAY_DAYS[inputs.cycleLength];

  // Fit (firmographic) rules. Always two: role match and size match.
  // Each is worth 10 points on Pro, 50 on Enterprise.
  const fitRules: ScoringRule[] = [
    {
      name: `Role matches target (${ROLE_LABEL[inputs.buyerRole]})`,
      points: 10 * mult,
      description:
        "Award when the contact's job title or seniority matches your primary buyer role.",
    },
    {
      name: `Company size matches target (${SIZE_LABEL[inputs.companySize]})`,
      points: 10 * mult,
      description:
        "Award when the contact's company size falls inside your target range.",
    },
  ];

  // Engagement rules from selected high-intent actions. Sorted by
  // point value descending so the heavy hitters land at the top of
  // the recommendation.
  const engagementRules: ScoringRule[] = inputs.highIntentActions
    .map((action): ScoringRule => {
      const def = BASE_INTENT[action];
      return {
        name: def.name,
        points: def.points * mult,
        description: def.description,
      };
    })
    .sort((a, b) => b.points - a.points);

  // Negative rules from selected disqualifiers. Sorted by magnitude
  // descending (most negative first).
  const negativeRules: ScoringRule[] = inputs.disqualifiers
    .map((disq): ScoringRule => {
      const def = BASE_DISQ[disq];
      return {
        name: def.name,
        points: def.points * mult,
        description: def.description,
      };
    })
    .sort((a, b) => a.points - b.points);

  const tierBLow = Math.floor(mqlThreshold / 2);
  const tiers: TierMapping[] = [
    {
      letter: "A",
      label: "Sales-ready (MQL)",
      range: `${mqlThreshold} to ${scoreCap}`,
      description:
        "Hand off to sales. Trigger an SLA workflow for outreach within 24 hours.",
    },
    {
      letter: "B",
      label: "Warming (nurture)",
      range: `${tierBLow} to ${mqlThreshold - 1}`,
      description:
        "Continue marketing nurture. Promote to A as additional engagement accumulates.",
    },
    {
      letter: "C",
      label: "Cold",
      range: `0 to ${tierBLow - 1}`,
      description:
        "Hold for awareness-stage content. Re-evaluate quarterly.",
    },
  ];

  return {
    scoreCap,
    mqlThreshold,
    split,
    decayDays,
    decayRate: "50 percent per month",
    fitRules,
    engagementRules,
    negativeRules,
    tiers,
  };
}

// ----------------------------------------------------------------- copy text

/**
 * Plain-text rendering of the model the visitor copies into HubSpot.
 * Mirrored on the client (clipboard) and the server (email body) so
 * both surfaces emit identical text.
 */
export function renderModelAsText(
  inputs: LeadScoringInputs,
  results: LeadScoringResults,
): string {
  const lines: string[] = [];
  lines.push("=== HUBSPOT LEAD SCORING MODEL ===");
  lines.push("");
  lines.push(`Tier: ${TIER_LABEL[inputs.tier]} (cap ${results.scoreCap} points)`);
  lines.push(`Sales cycle: ${CYCLE_LABEL[inputs.cycleLength]}`);
  lines.push(
    `Fit / Engagement split: ${results.split.fit} / ${results.split.engagement}`,
  );
  lines.push(`MQL threshold: ${results.mqlThreshold} points`);
  lines.push(
    `Score decay: ${results.decayRate}, fully decayed after ${results.decayDays} days`,
  );
  lines.push("");
  lines.push("--- FIT SCORING (firmographic) ---");
  for (const r of results.fitRules) {
    lines.push(`${formatPoints(r.points)}  ${r.name}`);
  }
  lines.push("");
  if (results.engagementRules.length > 0) {
    lines.push("--- ENGAGEMENT SCORING (positive) ---");
    for (const r of results.engagementRules) {
      lines.push(`${formatPoints(r.points)}  ${r.name}`);
    }
    lines.push("");
  }
  if (results.negativeRules.length > 0) {
    lines.push("--- NEGATIVE SCORING ---");
    for (const r of results.negativeRules) {
      lines.push(`${formatPoints(r.points)}  ${r.name}`);
    }
    lines.push("");
  }
  lines.push("--- TIER MAPPING ---");
  for (const t of results.tiers) {
    lines.push(`${t.letter} (${t.label}): ${t.range}`);
  }
  lines.push("");
  lines.push("--- IMPLEMENTATION ---");
  lines.push("1. Open HubSpot, navigate to Marketing > Lead Scoring.");
  lines.push("2. Create or edit your score property.");
  lines.push("3. Add the Fit rules above as positive criteria.");
  lines.push(
    "4. Add the Engagement rules above as positive criteria, scoped to the relevant page or form events.",
  );
  lines.push("5. Add the Negative rules above as negative criteria.");
  lines.push(
    `6. Configure decay: ${results.decayRate}, ${results.decayDays}-day window.`,
  );
  lines.push(
    `7. Add a workflow that fires on score >= ${results.mqlThreshold} to flag the contact as MQL and notify sales.`,
  );
  lines.push("8. Save and apply.");
  return lines.join("\n");
}

function formatPoints(points: number): string {
  const sign = points >= 0 ? "+" : "";
  return `${sign}${points}`.padEnd(6, " ");
}

// ----------------------------------------------------------------- labels

export const LABELS = {
  role: ROLE_LABEL,
  size: SIZE_LABEL,
  cycle: CYCLE_LABEL,
  tier: TIER_LABEL,
};
