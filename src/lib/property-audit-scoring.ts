/**
 * Pure scoring logic for the /tools/property-audit-checklist surface.
 * No side effects, no I/O. Imported by both the client component (for
 * live preview) and the API route (for the canonical score that lands
 * in Redis and the report email).
 *
 * Each of ten questions contributes 0 to 10 points to a 0 to 100 score.
 * Score thresholds map to four tier labels: Clean / Drift / Bloat /
 * Crisis. Action recommendations attach to the lowest-scoring questions
 * so the visitor walks away with a prioritized punch list rather than a
 * generic checklist.
 *
 * Calibration is from the portals Dunamis Studios has audited, not a
 * published benchmark. The methodology copy on the page and in the
 * report email is explicit about that distinction.
 */

export type PortalAge = "under_1" | "1_3" | "3_5" | "5_plus";
export type TriState = "yes" | "partial" | "no";
export type FillCoverage = "all" | "most" | "some" | "none";
export type AuditRecency = "90_days" | "1_year" | "over_year" | "never";
export type LowFillCount = "dont_know" | "under_10" | "10_50" | "50_plus";
export type DuplicateState = "no" | "suspect" | "yes" | "many";
export type CreationCadence = "never" | "rarely" | "often" | "no_process";
export type IncidentCount = "no" | "once" | "multiple";

export interface AuditAnswers {
  /** Total count of custom contact properties in the portal. */
  customPropertyCount: number;
  portalAge: PortalAge;
  namingConvention: TriState;
  descriptionsFilled: FillCoverage;
  lastAudit: AuditRecency;
  lowFillRateCount: LowFillCount;
  duplicates: DuplicateState;
  ownersAssigned: TriState;
  reviewCadence: CreationCadence;
  pastIncidents: IncidentCount;
}

export type Tier = "Clean" | "Drift" | "Bloat" | "Crisis";

export interface QuestionScore {
  /** Stable identifier for routing into the action map. */
  id: keyof AuditAnswers;
  /** Short label suitable for the report. */
  label: string;
  /** 0 to 10. */
  score: number;
}

export interface AuditResults {
  /** Sum of every per-question score. 0 to 100. */
  totalScore: number;
  tier: Tier;
  tierBlurb: string;
  /** Per-question breakdown in the same order as AuditAnswers. */
  perQuestion: QuestionScore[];
  /** Three highest-leverage actions, ranked by lowest-scoring questions. */
  topActions: AuditAction[];
}

export interface AuditAction {
  questionId: keyof AuditAnswers;
  title: string;
  body: string;
}

// ----------------------------------------------------------------- scoring

function scoreCount(n: number): number {
  if (n <= 50) return 10;
  if (n <= 150) return 8;
  if (n <= 300) return 5;
  return 2;
}

function scoreAge(age: PortalAge): number {
  switch (age) {
    case "under_1":
      return 9;
    case "1_3":
      return 10;
    case "3_5":
      return 7;
    case "5_plus":
      return 5;
  }
}

function scoreTri(s: TriState): number {
  switch (s) {
    case "yes":
      return 10;
    case "partial":
      return 5;
    case "no":
      return 0;
  }
}

function scoreFill(f: FillCoverage): number {
  switch (f) {
    case "all":
      return 10;
    case "most":
      return 7;
    case "some":
      return 3;
    case "none":
      return 0;
  }
}

function scoreAudit(a: AuditRecency): number {
  switch (a) {
    case "90_days":
      return 10;
    case "1_year":
      return 8;
    case "over_year":
      return 3;
    case "never":
      return 0;
  }
}

function scoreLowFill(c: LowFillCount): number {
  switch (c) {
    case "dont_know":
      return 2;
    case "under_10":
      return 9;
    case "10_50":
      return 5;
    case "50_plus":
      return 1;
  }
}

function scoreDuplicates(d: DuplicateState): number {
  switch (d) {
    case "no":
      return 10;
    case "suspect":
      return 6;
    case "yes":
      return 3;
    case "many":
      return 0;
  }
}

function scoreCreation(c: CreationCadence): number {
  switch (c) {
    case "never":
      return 10;
    case "rarely":
      return 7;
    case "often":
      return 3;
    case "no_process":
      return 0;
  }
}

function scoreIncidents(i: IncidentCount): number {
  switch (i) {
    case "no":
      return 10;
    case "once":
      return 6;
    case "multiple":
      return 2;
  }
}

// ----------------------------------------------------------------- actions

const ACTION_MAP: Record<keyof AuditAnswers, AuditAction> = {
  customPropertyCount: {
    questionId: "customPropertyCount",
    title: "Reduce schema bloat by archiving unused custom properties",
    body: "Audit your custom properties and archive anything with under 5% fill rate, no \"Used in\" references, and no recent writes. A maintained portal sits comfortably under 150 active custom properties per object.",
  },
  portalAge: {
    questionId: "portalAge",
    title: "Schedule a full audit if you have not run one this year",
    body: "Older portals accumulate drift even when they look fine on the surface. The longer the gap since the last audit, the more reports, workflows, and integrations are quietly leaning on stale fields.",
  },
  namingConvention: {
    questionId: "namingConvention",
    title: "Adopt a naming convention with team prefixes",
    body: "Custom properties created without a namespace become orphans within a quarter. Standardize a short prefix (ops_, mkt_, sales_, cs_) so ownership reads at a glance from the property list.",
  },
  descriptionsFilled: {
    questionId: "descriptionsFilled",
    title: "Fill the description on every custom property",
    body: "The description should answer \"what reads this?\" Make it a precondition for property creation. Properties without a documented consumer become stale in months because nobody knows whether deleting them breaks anything.",
  },
  lastAudit: {
    questionId: "lastAudit",
    title: "Run a full property audit",
    body: "Export the property list, pull \"Used in\" data, sample fill rate, derive last-write timestamps. Bucket each property into keep, archive, hide-from-forms, merge, or delete. The full process is documented in our guide on auditing stale HubSpot properties.",
  },
  lowFillRateCount: {
    questionId: "lowFillRateCount",
    title: "Get visibility into low-fill-rate properties",
    body: "Build a Custom Report Builder report covering fill rate per custom property. Anything under 5% is a candidate for archive. Not knowing the answer is itself the signal that the schema has gotten away from active management.",
  },
  duplicates: {
    questionId: "duplicates",
    title: "Find and merge duplicate properties",
    body: "Sort the property list by group, scan for similar labels and similar internal names. For each duplicate pair, build a workflow that copies values from the source to the canonical destination, then archive the source.",
  },
  ownersAssigned: {
    questionId: "ownersAssigned",
    title: "Assign an owner to every property group",
    body: "Owners gate creation in their group and review their group once a quarter. Without owners, every team member can create properties freely and the schema bloats without anyone responsible for the trend.",
  },
  reviewCadence: {
    questionId: "reviewCadence",
    title: "Add a creation review step before new properties ship",
    body: "Require a stated consumer in the description on every new property. The bar can be informal (a Slack message to the property-group owner) but it has to exist. Free creation with no friction is the single biggest driver of bloat.",
  },
  pastIncidents: {
    questionId: "pastIncidents",
    title: "Document every property-driven incident",
    body: "Patterns in past incidents tell you which areas of the schema are load-bearing and which workflows depend on which fields. Treat every break as data; the next one is cheaper to prevent if you wrote down the last one.",
  },
};

// ----------------------------------------------------------------- public

export function scoreAudit_(answers: AuditAnswers): AuditResults {
  const perQuestion: QuestionScore[] = [
    {
      id: "customPropertyCount",
      label: "Custom property count",
      score: scoreCount(answers.customPropertyCount),
    },
    { id: "portalAge", label: "Portal age", score: scoreAge(answers.portalAge) },
    {
      id: "namingConvention",
      label: "Naming convention",
      score: scoreTri(answers.namingConvention),
    },
    {
      id: "descriptionsFilled",
      label: "Description coverage",
      score: scoreFill(answers.descriptionsFilled),
    },
    {
      id: "lastAudit",
      label: "Last full audit",
      score: scoreAudit(answers.lastAudit),
    },
    {
      id: "lowFillRateCount",
      label: "Low-fill-rate visibility",
      score: scoreLowFill(answers.lowFillRateCount),
    },
    {
      id: "duplicates",
      label: "Duplicate properties",
      score: scoreDuplicates(answers.duplicates),
    },
    {
      id: "ownersAssigned",
      label: "Property ownership",
      score: scoreTri(answers.ownersAssigned),
    },
    {
      id: "reviewCadence",
      label: "Creation review",
      score: scoreCreation(answers.reviewCadence),
    },
    {
      id: "pastIncidents",
      label: "Past property-driven incidents",
      score: scoreIncidents(answers.pastIncidents),
    },
  ];

  const totalScore = perQuestion.reduce((acc, q) => acc + q.score, 0);
  const tier = tierFor(totalScore);
  const tierBlurb = TIER_BLURBS[tier];

  // Top 3 actions: rank by lowest score, then by question order to make
  // ties stable. A perfect 10 still counts as a candidate so a portal
  // that scores 100 returns three actions, but they will be the
  // weakest links among 10s rather than zeros, and the action copy
  // generalizes well enough that "keep doing what you are doing" still
  // reads as useful.
  const ranked = [...perQuestion].sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return perQuestion.indexOf(a) - perQuestion.indexOf(b);
  });
  const topActions = ranked.slice(0, 3).map((q) => ACTION_MAP[q.id]);

  return { totalScore, tier, tierBlurb, perQuestion, topActions };
}

function tierFor(score: number): Tier {
  if (score >= 80) return "Clean";
  if (score >= 50) return "Drift";
  if (score >= 20) return "Bloat";
  return "Crisis";
}

const TIER_BLURBS: Record<Tier, string> = {
  Clean:
    "Your portal is well-maintained. Keep the cadence and the schema stays clean.",
  Drift:
    "Drift is starting to compound. A focused audit will reset the baseline before bloat takes hold.",
  Bloat:
    "Schema bloat is real. Reports and workflows are at higher risk of silently breaking on stale fields.",
  Crisis:
    "Active risk to data quality and reporting. Prioritize a full audit and ownership reset.",
};

// ----------------------------------------------------------------- labels

/**
 * Human-readable labels for each enum value, used in the report email
 * and in the answer breakdown displayed to the visitor.
 */
export const ANSWER_LABELS = {
  portalAge: {
    under_1: "Under 1 year",
    "1_3": "1 to 3 years",
    "3_5": "3 to 5 years",
    "5_plus": "5+ years",
  },
  triState: {
    yes: "Yes",
    partial: "Partial",
    no: "No",
  },
  fillCoverage: {
    all: "All",
    most: "Most",
    some: "Some",
    none: "None",
  },
  auditRecency: {
    "90_days": "Within 90 days",
    "1_year": "Within a year",
    over_year: "Over a year ago",
    never: "Never",
  },
  lowFillCount: {
    dont_know: "Don't know",
    under_10: "Under 10",
    "10_50": "10 to 50",
    "50_plus": "50+",
  },
  duplicateState: {
    no: "No",
    suspect: "Suspect we do",
    yes: "Yes",
    many: "Many",
  },
  creationCadence: {
    never: "Never",
    rarely: "Rarely",
    often: "Often",
    no_process: "No process",
  },
  incidentCount: {
    no: "No",
    once: "Once",
    multiple: "Multiple times",
  },
} as const;
