/**
 * Pure scoring logic for /tools/workflow-audit-checklist.
 * No side effects, no I/O. Imported by the client component (live
 * preview) and the API route (canonical score persisted to Redis and
 * mailed in the report).
 *
 * Eight questions feed a weighted 0 to 100 score across four
 * categories: ownership and documentation (30%), conflict signals
 * (30%), audit cadence (20%), and recent incidents (20%). Two
 * additional inputs (total active workflows, HubSpot tier) are not
 * scored; they drive a cap-utilization comparison against the
 * published per-tier active-workflow limit.
 *
 * Tier limits and conflict patterns are from HubSpot's product
 * documentation and HubSpot agency sources (Daeda, JetStack AI).
 * The cap thresholds (80% approaching, 95% critical) and the
 * scoring weights are Dunamis model assumptions, labelled as such
 * in the methodology copy.
 */

export type HubSpotTier =
  | "marketing_pro"
  | "marketing_enterprise"
  | "ops_starter"
  | "ops_pro"
  | "ops_enterprise";
export type AuditCadence = "90_days" | "1_year" | "over_year" | "never";
export type TriState = "yes" | "partial" | "no";
export type FillCoverage = "all" | "most" | "some" | "none";
export type ConflictState = "no" | "suspect" | "yes" | "many";
export type ReenrollmentState = "yes" | "partial" | "no" | "unsure";
export type IncidentCount = "none" | "once" | "multiple";

export interface WorkflowAuditAnswers {
  totalActiveWorkflows: number;
  tier: HubSpotTier;
  lastAudit: AuditCadence;
  namingConvention: TriState;
  ownersAssigned: TriState;
  descriptionsFilled: FillCoverage;
  duplicatePropertyWriters: ConflictState;
  archivedReferences: ConflictState;
  reenrollmentIntent: ReenrollmentState;
  recentIncidents: IncidentCount;
}

export type Tier = "Healthy" | "Drift" | "Bloat" | "Crisis";
export type CapStatus = "lean" | "moderate" | "approaching" | "critical";

export interface QuestionScore {
  /** Stable identifier for routing into the action map. */
  id: keyof Omit<WorkflowAuditAnswers, "totalActiveWorkflows" | "tier">;
  label: string;
  /** Points scored. */
  score: number;
  /** Maximum possible points for this question (10 or 20). */
  maxScore: number;
  /** Loss = maxScore - score. Used to rank top actions. */
  loss: number;
}

export interface CapUtilization {
  tier: HubSpotTier;
  tierLabel: string;
  totalActiveWorkflows: number;
  activeWorkflowLimit: number;
  utilizationPct: number;
  status: CapStatus;
  /** One-line headline for display, e.g. "240 / 300 used (80%, approaching cap)". */
  headline: string;
}

export interface WorkflowAuditAction {
  questionId: QuestionScore["id"];
  title: string;
  body: string;
}

export interface WorkflowAuditResults {
  totalScore: number;
  tier: Tier;
  tierBlurb: string;
  perQuestion: QuestionScore[];
  topActions: WorkflowAuditAction[];
  capUtilization: CapUtilization;
}

// ----------------------------------------------------------------- tier limits

/**
 * Active workflow limits per HubSpot tier. Sources: HubSpot product
 * limits documentation (Marketing Hub Pro 300 / Enterprise 1,000;
 * Operations Hub Starter 400 / Enterprise 1,100). Operations Hub
 * Pro is set to 1,000 to match the standard mid-tier cap.
 */
const TIER_LIMITS: Record<
  HubSpotTier,
  { label: string; activeWorkflows: number }
> = {
  marketing_pro: { label: "Marketing Pro", activeWorkflows: 300 },
  marketing_enterprise: {
    label: "Marketing Enterprise",
    activeWorkflows: 1000,
  },
  ops_starter: {
    label: "Operations Hub Starter",
    activeWorkflows: 400,
  },
  ops_pro: { label: "Operations Hub Pro", activeWorkflows: 1000 },
  ops_enterprise: {
    label: "Operations Hub Enterprise",
    activeWorkflows: 1100,
  },
};

// ----------------------------------------------------------------- per-question scoring

function scoreAudit(a: AuditCadence): number {
  switch (a) {
    case "90_days":
      return 20;
    case "1_year":
      return 12;
    case "over_year":
      return 4;
    case "never":
      return 0;
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

function scoreConflict(c: ConflictState): number {
  switch (c) {
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

function scoreReenrollment(r: ReenrollmentState): number {
  switch (r) {
    case "yes":
      return 10;
    case "partial":
      return 6;
    case "no":
      return 2;
    case "unsure":
      return 0;
  }
}

function scoreIncidents(i: IncidentCount): number {
  switch (i) {
    case "none":
      return 20;
    case "once":
      return 10;
    case "multiple":
      return 0;
  }
}

// ----------------------------------------------------------------- actions

const ACTION_MAP: Record<QuestionScore["id"], WorkflowAuditAction> = {
  lastAudit: {
    questionId: "lastAudit",
    title: "Schedule a quarterly workflow audit",
    body: "Block 90 minutes per quarter to review every active workflow with its owner. Confirm the trigger still fires the right population, the actions are still relevant, and re-enrollment is intentional. The HubSpot agency consensus is quarterly cadence; portals that audit annually accumulate drift faster than they can ship new automation.",
  },
  namingConvention: {
    questionId: "namingConvention",
    title: "Adopt a workflow naming convention",
    body: "Use a consistent format like \"[Object] | [Trigger] | [Outcome]\" (for example, \"Contact | Form Fill | Demo Sequence\"). Naming reads from the workflow list at a glance and makes orphaned automation obvious. Without a convention, the list becomes unreadable past 50 workflows.",
  },
  ownersAssigned: {
    questionId: "ownersAssigned",
    title: "Assign an owner to every active workflow",
    body: "Use HubSpot's owner field or a custom property if needed. Owners are responsible for reviewing their workflows quarterly and approving changes. Without owners, every workflow drifts toward dust collector status because no one is accountable for keeping it sharp.",
  },
  descriptionsFilled: {
    questionId: "descriptionsFilled",
    title: "Fill in the description on every active workflow",
    body: "Include the trigger, the action, and the business reason in plain English. Make it a precondition for shipping new workflows. A description-less workflow is one team rotation away from being orphaned because no one remembers what it does or why.",
  },
  duplicatePropertyWriters: {
    questionId: "duplicatePropertyWriters",
    title: "Audit workflows that write to the same property",
    body: "Lifecycle stage, lead source, and lead status are the usual culprits. Two workflows fighting over one property cause flapping values, broken reports, and re-enrollment loops. Per Daeda's HubSpot workflow conflict guide: identify writers via Properties > [property] > Used in, then consolidate into a single source-of-truth workflow.",
  },
  archivedReferences: {
    questionId: "archivedReferences",
    title: "Find workflows referencing archived lists or properties",
    body: "Archived references silently fail and create orphan logic that never triggers. Run through every active workflow's enrollment criteria and action steps; flag any that point at archived assets. JetStack AI's audit checklist calls this out as one of the top three causes of silently-broken automation.",
  },
  reenrollmentIntent: {
    questionId: "reenrollmentIntent",
    title: "Review every workflow's re-enrollment configuration",
    body: "Default re-enrollment causes duplicate emails, infinite loops, and over-notification. For each active workflow, decide whether re-enrollment should be on, off, or limited to specific triggers. Document the choice in the description so the next person to look at the workflow understands the intent.",
  },
  recentIncidents: {
    questionId: "recentIncidents",
    title: "Trace each recent incident back to its source workflow",
    body: "Duplicate emails, misrouted leads, and broken reports are usually downstream effects of one or two misconfigured workflows. Document each incident in a shared doc with the workflow name, the misconfiguration, and the fix. Patterns surface root causes; treating each incident in isolation just buys you the next one.",
  },
};

// ----------------------------------------------------------------- public

export function scoreWorkflowAudit_(
  answers: WorkflowAuditAnswers,
): WorkflowAuditResults {
  const perQuestion: QuestionScore[] = [
    {
      id: "lastAudit",
      label: "Last workflow audit",
      score: scoreAudit(answers.lastAudit),
      maxScore: 20,
      loss: 20 - scoreAudit(answers.lastAudit),
    },
    {
      id: "namingConvention",
      label: "Naming convention",
      score: scoreTri(answers.namingConvention),
      maxScore: 10,
      loss: 10 - scoreTri(answers.namingConvention),
    },
    {
      id: "ownersAssigned",
      label: "Owner assigned",
      score: scoreTri(answers.ownersAssigned),
      maxScore: 10,
      loss: 10 - scoreTri(answers.ownersAssigned),
    },
    {
      id: "descriptionsFilled",
      label: "Description coverage",
      score: scoreFill(answers.descriptionsFilled),
      maxScore: 10,
      loss: 10 - scoreFill(answers.descriptionsFilled),
    },
    {
      id: "duplicatePropertyWriters",
      label: "Duplicate property writers",
      score: scoreConflict(answers.duplicatePropertyWriters),
      maxScore: 10,
      loss: 10 - scoreConflict(answers.duplicatePropertyWriters),
    },
    {
      id: "archivedReferences",
      label: "Archived list / property references",
      score: scoreConflict(answers.archivedReferences),
      maxScore: 10,
      loss: 10 - scoreConflict(answers.archivedReferences),
    },
    {
      id: "reenrollmentIntent",
      label: "Re-enrollment intent",
      score: scoreReenrollment(answers.reenrollmentIntent),
      maxScore: 10,
      loss: 10 - scoreReenrollment(answers.reenrollmentIntent),
    },
    {
      id: "recentIncidents",
      label: "Recent incidents",
      score: scoreIncidents(answers.recentIncidents),
      maxScore: 20,
      loss: 20 - scoreIncidents(answers.recentIncidents),
    },
  ];

  const totalScore = perQuestion.reduce((acc, q) => acc + q.score, 0);
  const tier = tierFor(totalScore);
  const tierBlurb = TIER_BLURBS[tier];

  // Top 3 actions: rank by points lost (loss desc), then by question
  // order to make ties stable. The biggest absolute loss is the
  // highest-leverage fix; cadence and incident questions naturally
  // rank higher because they are double-weighted.
  const ranked = [...perQuestion].sort((a, b) => {
    if (a.loss !== b.loss) return b.loss - a.loss;
    return perQuestion.indexOf(a) - perQuestion.indexOf(b);
  });
  const topActions = ranked.slice(0, 3).map((q) => ACTION_MAP[q.id]);

  const capUtilization = computeCapUtilization(
    answers.tier,
    answers.totalActiveWorkflows,
  );

  return {
    totalScore,
    tier,
    tierBlurb,
    perQuestion,
    topActions,
    capUtilization,
  };
}

function tierFor(score: number): Tier {
  if (score >= 80) return "Healthy";
  if (score >= 50) return "Drift";
  if (score >= 20) return "Bloat";
  return "Crisis";
}

const TIER_BLURBS: Record<Tier, string> = {
  Healthy:
    "Workflow operations are well-maintained. Keep the audit cadence and ownership discipline.",
  Drift:
    "Drift is starting. A focused audit and ownership reset clears it before it compounds into bloat.",
  Bloat:
    "Workflows are accumulating drift. Conflicts, archived references, and re-enrollment loops are likely active risks.",
  Crisis:
    "Active risk to deliverability and routing. Prioritize a full audit, ownership assignment, and re-enrollment review.",
};

function computeCapUtilization(
  tier: HubSpotTier,
  totalActive: number,
): CapUtilization {
  const limit = TIER_LIMITS[tier].activeWorkflows;
  const safeTotal = Math.max(0, totalActive);
  const utilizationPct =
    limit > 0 ? Math.round((safeTotal / limit) * 100) : 0;

  let status: CapStatus;
  if (utilizationPct < 50) status = "lean";
  else if (utilizationPct < 80) status = "moderate";
  else if (utilizationPct < 95) status = "approaching";
  else status = "critical";

  const statusLabel = capStatusLabel(status);
  const headline = `${safeTotal.toLocaleString("en-US")} / ${limit.toLocaleString("en-US")} used (${utilizationPct}%, ${statusLabel.toLowerCase()})`;

  return {
    tier,
    tierLabel: TIER_LIMITS[tier].label,
    totalActiveWorkflows: safeTotal,
    activeWorkflowLimit: limit,
    utilizationPct,
    status,
    headline,
  };
}

export function capStatusLabel(status: CapStatus): string {
  switch (status) {
    case "lean":
      return "Plenty of room";
    case "moderate":
      return "Moderate utilization";
    case "approaching":
      return "Approaching cap";
    case "critical":
      return "Critical: at or near cap";
  }
}

// ----------------------------------------------------------------- labels

export const ANSWER_LABELS = {
  tier: {
    marketing_pro: "Marketing Pro",
    marketing_enterprise: "Marketing Enterprise",
    ops_starter: "Operations Hub Starter",
    ops_pro: "Operations Hub Pro",
    ops_enterprise: "Operations Hub Enterprise",
  },
  auditCadence: {
    "90_days": "Within 90 days",
    "1_year": "Within a year",
    over_year: "Over a year ago",
    never: "Never",
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
  conflictState: {
    no: "No",
    suspect: "Suspect we do",
    yes: "Yes",
    many: "Many",
  },
  reenrollmentState: {
    yes: "Yes",
    partial: "Partial",
    no: "No",
    unsure: "Unsure",
  },
  incidentCount: {
    none: "None",
    once: "Once",
    multiple: "Multiple",
  },
} as const;

export const TIER_LIMIT_PUBLIC = TIER_LIMITS;
