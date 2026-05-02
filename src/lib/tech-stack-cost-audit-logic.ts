/**
 * Pure logic for /tools/tech-stack-cost-audit. No side effects, no
 * I/O. Imported by the client component (live preview) and the API
 * route (canonical numbers persisted to Redis and mailed in the
 * report).
 *
 * Quantifies SaaS spend, license waste, category overlap, and
 * consolidation opportunities across a team's tool stack. Benchmarks
 * pulled from Zylo 2026 SaaS Management Index, BetterCloud, and
 * Cleed 2026 sales-tech roundup; Dunamis heuristics labelled as
 * such.
 */

export type ToolCategory =
  | "crm"
  | "marketing_automation"
  | "sales_engagement"
  | "email"
  | "calendar"
  | "meeting_tools"
  | "call_recording"
  | "sales_intelligence"
  | "lead_scoring"
  | "enrichment"
  | "forms_surveys"
  | "project_management"
  | "communication"
  | "analytics"
  | "data_warehouse"
  | "customer_success"
  | "support"
  | "documentation"
  | "other";

export type UsageLevel = "daily" | "weekly" | "monthly" | "rarely" | "unknown";

export type RevenueRange = "under_1m" | "1_10m" | "10_50m" | "50m_plus";

export interface Tool {
  /** Stable identifier for React keys. Server ignores. */
  id: string;
  name: string;
  category: ToolCategory;
  /** Monthly cost per seat in USD. */
  costPerSeat: number;
  seats: number;
  usageLevel: UsageLevel;
}

export interface TechStackCostAuditInputs {
  tools: Tool[];
  teamSize: number;
  revenueRange: RevenueRange;
}

export interface ToolFinancials {
  id: string;
  name: string;
  category: ToolCategory;
  categoryLabel: string;
  usageLevel: UsageLevel;
  usageLabel: string;
  monthlyCost: number;
  annualCost: number;
}

export interface OverlapCategory {
  category: ToolCategory;
  categoryLabel: string;
  tools: ToolFinancials[];
  /** Annual cost of all tools in the category combined. */
  totalAnnualCost: number;
  /** 50% of cost of all but the highest-usage tool. */
  estimatedAnnualSavings: number;
  /** Name of the tool we recommend keeping (highest-usage in the group). */
  recommendedKeeper: string;
}

export type UnderutilizedTool = ToolFinancials;

export type SpendStatus = "below" | "at" | "above";
export type ToolCountStatus = "lean" | "average" | "bloated";

export interface TechStackCostAuditResults {
  // ---- Money totals
  totalAnnualSpend: number;
  totalMonthlySpend: number;
  spendPerEmployee: number;
  benchmarkSpendPerEmployee: number;
  spendStatus: SpendStatus;
  spendDeltaPerEmployee: number;
  /** Annual license waste estimate at the Zylo 46% non-utilization rate. */
  licenseWasteEstimate: number;

  // ---- Tool count
  totalToolCount: number;
  totalSeats: number;
  enterpriseAvgToolCount: number;
  salesTeamAvgLow: number;
  salesTeamAvgHigh: number;
  consolidatedTargetToolCount: number;
  toolCountStatus: ToolCountStatus;

  // ---- Per-tool breakdown
  toolsByAnnualCost: ToolFinancials[];

  // ---- Overlap
  overlaps: OverlapCategory[];
  topConsolidationOpportunities: OverlapCategory[];
  totalConsolidationSavings: number;

  // ---- Underutilized
  underutilizedTools: UnderutilizedTool[];
  underutilizedAnnualSpend: number;
}

// ----------------------------------------------------------------- labels

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  crm: "CRM",
  marketing_automation: "Marketing Automation",
  sales_engagement: "Sales Engagement",
  email: "Email",
  calendar: "Calendar",
  meeting_tools: "Meeting Tools",
  call_recording: "Call Recording",
  sales_intelligence: "Sales Intelligence",
  lead_scoring: "Lead Scoring",
  enrichment: "Enrichment",
  forms_surveys: "Forms / Surveys",
  project_management: "Project Management",
  communication: "Communication",
  analytics: "Analytics",
  data_warehouse: "Data Warehouse",
  customer_success: "Customer Success",
  support: "Support",
  documentation: "Documentation",
  other: "Other",
};

export const USAGE_LABELS: Record<UsageLevel, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  rarely: "Rarely",
  unknown: "Unknown",
};

export const REVENUE_LABELS: Record<RevenueRange, string> = {
  under_1m: "Under $1M",
  "1_10m": "$1M to $10M",
  "10_50m": "$10M to $50M",
  "50m_plus": "$50M+",
};

const USAGE_RANK: Record<UsageLevel, number> = {
  daily: 4,
  weekly: 3,
  monthly: 2,
  rarely: 1,
  unknown: 0,
};

/**
 * Dunamis model assumption. Extrapolated from Zylo 2026 ($20.6M
 * median enterprise spend across roughly 1,000 employees = ~$20K
 * per employee at the enterprise band). Smaller revenue brackets
 * scale down with industry-typical SaaS-density observations.
 */
const SPEND_PER_EMPLOYEE_BENCHMARK: Record<RevenueRange, number> = {
  under_1m: 1500,
  "1_10m": 4500,
  "10_50m": 10000,
  "50m_plus": 20000,
};

// Zylo 2026 SaaS Management Index: avg 106 apps at enterprise.
const ENTERPRISE_AVG_TOOL_COUNT = 106;
// Cleed 2026: avg sales team uses 10 to 15 tools.
const SALES_TEAM_LOW = 10;
const SALES_TEAM_HIGH = 15;
// Cleed 2026: consolidated leaders target 6.
const CONSOLIDATED_TARGET = 6;
// Zylo 2026: 54% license utilization, i.e. 46% non-utilization.
const LICENSE_WASTE_RATE = 0.46;
// Dunamis model assumption: 50% of cost of all but the top-usage
// tool in a category is recoverable. Consolidation never hits 100%
// because the keeper still has to absorb migrated workflows.
const OVERLAP_SAVINGS_RATE = 0.5;

// ----------------------------------------------------------------- compute

export function computeTechStackCostAudit(
  inputs: TechStackCostAuditInputs,
): TechStackCostAuditResults {
  const teamSize = Math.max(1, inputs.teamSize);

  const validTools = inputs.tools.filter(
    (t) =>
      t.name.trim().length > 0 &&
      Number.isFinite(t.costPerSeat) &&
      Number.isFinite(t.seats),
  );

  const toolsByAnnualCost: ToolFinancials[] = validTools
    .map((t) => {
      const monthly = Math.max(0, t.costPerSeat) * Math.max(0, t.seats);
      return {
        id: t.id,
        name: t.name.trim(),
        category: t.category,
        categoryLabel: CATEGORY_LABELS[t.category],
        usageLevel: t.usageLevel,
        usageLabel: USAGE_LABELS[t.usageLevel],
        monthlyCost: monthly,
        annualCost: monthly * 12,
      };
    })
    .sort((a, b) => b.annualCost - a.annualCost);

  const totalMonthlySpend = toolsByAnnualCost.reduce(
    (sum, t) => sum + t.monthlyCost,
    0,
  );
  const totalAnnualSpend = totalMonthlySpend * 12;
  const spendPerEmployee = totalAnnualSpend / teamSize;
  const benchmarkSpendPerEmployee =
    SPEND_PER_EMPLOYEE_BENCHMARK[inputs.revenueRange];
  const spendDeltaPerEmployee = spendPerEmployee - benchmarkSpendPerEmployee;
  const tolerance = benchmarkSpendPerEmployee * 0.1;
  const spendStatus: SpendStatus =
    spendDeltaPerEmployee > tolerance
      ? "above"
      : spendDeltaPerEmployee < -tolerance
        ? "below"
        : "at";

  const licenseWasteEstimate = totalAnnualSpend * LICENSE_WASTE_RATE;

  const totalToolCount = toolsByAnnualCost.length;
  const totalSeats = validTools.reduce(
    (sum, t) => sum + Math.max(0, t.seats),
    0,
  );

  let toolCountStatus: ToolCountStatus;
  if (totalToolCount <= CONSOLIDATED_TARGET) toolCountStatus = "lean";
  else if (totalToolCount <= SALES_TEAM_HIGH) toolCountStatus = "average";
  else toolCountStatus = "bloated";

  // Group by category, keep only categories with 2+ tools.
  const byCategory = new Map<ToolCategory, ToolFinancials[]>();
  for (const t of toolsByAnnualCost) {
    const arr = byCategory.get(t.category) ?? [];
    arr.push(t);
    byCategory.set(t.category, arr);
  }

  const overlaps: OverlapCategory[] = [];
  for (const [cat, tools] of byCategory.entries()) {
    if (tools.length < 2) continue;
    // Sort by usage rank desc; tie-break by annual cost desc so the
    // "kept" tool is the one in active use, not the cheapest dust
    // collector.
    const sorted = [...tools].sort((a, b) => {
      const rankDiff = USAGE_RANK[b.usageLevel] - USAGE_RANK[a.usageLevel];
      if (rankDiff !== 0) return rankDiff;
      return b.annualCost - a.annualCost;
    });
    const keeper = sorted[0];
    const replaceable = sorted.slice(1);
    const replaceableSpend = replaceable.reduce(
      (sum, t) => sum + t.annualCost,
      0,
    );
    const totalAnnualCost = sorted.reduce((sum, t) => sum + t.annualCost, 0);
    overlaps.push({
      category: cat,
      categoryLabel: CATEGORY_LABELS[cat],
      tools: sorted,
      totalAnnualCost,
      estimatedAnnualSavings: replaceableSpend * OVERLAP_SAVINGS_RATE,
      recommendedKeeper: keeper.name,
    });
  }

  // Sort by potential savings desc; top 3 are the consolidation
  // recommendations the report leads with.
  overlaps.sort((a, b) => b.estimatedAnnualSavings - a.estimatedAnnualSavings);
  const topConsolidationOpportunities = overlaps.slice(0, 3);
  const totalConsolidationSavings = overlaps.reduce(
    (sum, o) => sum + o.estimatedAnnualSavings,
    0,
  );

  const underutilizedTools = toolsByAnnualCost.filter(
    (t) => t.usageLevel === "rarely" || t.usageLevel === "unknown",
  );
  const underutilizedAnnualSpend = underutilizedTools.reduce(
    (sum, t) => sum + t.annualCost,
    0,
  );

  return {
    totalAnnualSpend,
    totalMonthlySpend,
    spendPerEmployee,
    benchmarkSpendPerEmployee,
    spendStatus,
    spendDeltaPerEmployee,
    licenseWasteEstimate,
    totalToolCount,
    totalSeats,
    enterpriseAvgToolCount: ENTERPRISE_AVG_TOOL_COUNT,
    salesTeamAvgLow: SALES_TEAM_LOW,
    salesTeamAvgHigh: SALES_TEAM_HIGH,
    consolidatedTargetToolCount: CONSOLIDATED_TARGET,
    toolCountStatus,
    toolsByAnnualCost,
    overlaps,
    topConsolidationOpportunities,
    totalConsolidationSavings,
    underutilizedTools,
    underutilizedAnnualSpend,
  };
}

// ----------------------------------------------------------------- formatting

export function fmtUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function spendStatusLabel(status: SpendStatus): string {
  if (status === "above") return "Above benchmark";
  if (status === "below") return "Below benchmark";
  return "At benchmark";
}

export function toolCountStatusLabel(status: ToolCountStatus): string {
  if (status === "lean") return "Lean";
  if (status === "average") return "Industry average";
  return "Above industry average";
}
