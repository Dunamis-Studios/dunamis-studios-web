/**
 * Pure logic for /tools/sales-cycle-stagnation-calculator.
 * No side effects, no I/O. Imported by the client component (live
 * preview) and the API route (canonical numbers persisted to Redis
 * and mailed in the report).
 *
 * Quantifies the dollar value of stalled pipeline by combining deal
 * economics with stage-stagnation counts. Compares the visitor's
 * cycle and win rate against deal-size-bracket benchmarks pulled from
 * Optifai 2025 (cycle length) and Digital Bloom 2025 (win rate).
 */

export interface SalesCycleStagnationInputs {
  /** Average deal size in USD. */
  avgDealSize: number;
  /** Average sales cycle length in days. */
  avgCycleLength: number;
  /** Number of stages in the pipeline. */
  numStages: number;
  /** Total active deals in pipeline right now. */
  activeDeals: number;
  /**
   * Total pipeline value override in USD. When null, the calculator
   * uses activeDeals * avgDealSize.
   */
  totalPipelineValueOverride: number | null;
  /** Win rate as a percentage (0 to 100). */
  winRatePct: number;
  /**
   * Average days a deal sits in one stage override. When null, the
   * calculator uses avgCycleLength / numStages.
   */
  avgStageTimeOverride: number | null;
  /** Deals that have not moved stage in 2x average stage time or longer. */
  dealsAtRisk: number;
  /** Deals that have not moved stage in 3x average stage time or longer. */
  dealsCritical: number;
}

export type DealBracket = "smb" | "mid" | "enterprise";
export type CycleStatus = "fast" | "within" | "slow";
export type WinRateStatus = "above" | "at" | "below";

export interface SalesCycleStagnationResults {
  /** Resolved pipeline value (override if set, otherwise activeDeals * dealSize). */
  effectivePipelineValue: number;
  /** Resolved per-stage time (override if set, otherwise cycle / stages). */
  effectiveStageTime: number;

  // ---- Risk dollar values
  /** dealsAtRisk * dealSize * winRate. Expected lost revenue from stalled deals. */
  pipelineValueAtRisk: number;
  /** dealsCritical * dealSize * winRate. Subset of pipelineValueAtRisk. */
  pipelineValueCritical: number;
  /** dealSize * winRate / cycleLength. Daily expected value of a typical deal. */
  dailyRevenueLostPerStalledDeal: number;
  /** dealsAtRisk * dailyRevenueLostPerStalledDeal. Total daily bleed across all stalled deals. */
  totalDailyBleed: number;

  // ---- Velocity
  /** activeDeals * dealSize * winRate / cycleLength. Standard pipeline velocity formula. */
  pipelineVelocity: number;
  /** Same shape, but using bracket median cycle and bracket benchmark win rate. */
  benchmarkVelocity: number;
  /** pipelineVelocity - benchmarkVelocity. Positive means above benchmark. */
  velocityDelta: number;

  // ---- Bracket
  bracket: DealBracket;
  bracketLabel: string;
  bracketCycleLow: number;
  bracketCycleHigh: number;
  bracketCycleMedian: number;
  /** Benchmark win rate as a percentage. */
  bracketWinRate: number;

  // ---- Comparisons
  cycleStatus: CycleStatus;
  /** cycle - bracketCycleMedian. Positive means slower than median. */
  cycleDeltaDays: number;
  winRateStatus: WinRateStatus;
  /** winRatePct - bracketWinRate. Positive means above benchmark. */
  winRateDelta: number;
}

/**
 * Deal-size brackets with cycle and win-rate benchmarks.
 * Cycle ranges and median: Optifai 2025 sales-cycle benchmarks.
 * Win rates: Digital Bloom 2025 sales-stats roundup.
 */
function bracketFor(dealSize: number): {
  bracket: DealBracket;
  label: string;
  cycleLow: number;
  cycleHigh: number;
  cycleMedian: number;
  winRate: number;
} {
  if (dealSize < 15000) {
    return {
      bracket: "smb",
      label: "SMB (under $15K average deal)",
      cycleLow: 14,
      cycleHigh: 30,
      cycleMedian: 22,
      winRate: 35,
    };
  }
  if (dealSize < 100000) {
    return {
      bracket: "mid",
      label: "Mid-market ($15K to $100K average deal)",
      cycleLow: 30,
      cycleHigh: 90,
      cycleMedian: 60,
      winRate: 30,
    };
  }
  return {
    bracket: "enterprise",
    label: "Enterprise ($100K+ average deal)",
    cycleLow: 90,
    cycleHigh: 180,
    cycleMedian: 135,
    winRate: 25,
  };
}

export function computeSalesCycleStagnation(
  inputs: SalesCycleStagnationInputs,
): SalesCycleStagnationResults {
  const dealSize = Math.max(0, inputs.avgDealSize);
  const cycle = Math.max(1, inputs.avgCycleLength);
  const stages = Math.max(1, inputs.numStages);
  const winRate = Math.max(0, Math.min(100, inputs.winRatePct)) / 100;
  const activeDeals = Math.max(0, inputs.activeDeals);
  const dealsAtRisk = Math.max(0, inputs.dealsAtRisk);
  const dealsCritical = Math.max(0, inputs.dealsCritical);

  const effectivePipelineValue =
    inputs.totalPipelineValueOverride !== null &&
    inputs.totalPipelineValueOverride > 0
      ? inputs.totalPipelineValueOverride
      : activeDeals * dealSize;

  const effectiveStageTime =
    inputs.avgStageTimeOverride !== null && inputs.avgStageTimeOverride > 0
      ? inputs.avgStageTimeOverride
      : cycle / stages;

  const pipelineValueAtRisk = dealsAtRisk * dealSize * winRate;
  const pipelineValueCritical = dealsCritical * dealSize * winRate;
  const dailyRevenueLostPerStalledDeal = (dealSize * winRate) / cycle;
  const totalDailyBleed = dealsAtRisk * dailyRevenueLostPerStalledDeal;

  const pipelineVelocity = (activeDeals * dealSize * winRate) / cycle;

  const b = bracketFor(dealSize);
  const benchmarkVelocity =
    (activeDeals * dealSize * (b.winRate / 100)) / b.cycleMedian;
  const velocityDelta = pipelineVelocity - benchmarkVelocity;

  let cycleStatus: CycleStatus;
  if (cycle < b.cycleLow) cycleStatus = "fast";
  else if (cycle <= b.cycleHigh) cycleStatus = "within";
  else cycleStatus = "slow";
  const cycleDeltaDays = cycle - b.cycleMedian;

  let winRateStatus: WinRateStatus;
  if (inputs.winRatePct > b.winRate + 0.5) winRateStatus = "above";
  else if (inputs.winRatePct < b.winRate - 0.5) winRateStatus = "below";
  else winRateStatus = "at";
  const winRateDelta = inputs.winRatePct - b.winRate;

  return {
    effectivePipelineValue,
    effectiveStageTime,
    pipelineValueAtRisk,
    pipelineValueCritical,
    dailyRevenueLostPerStalledDeal,
    totalDailyBleed,
    pipelineVelocity,
    benchmarkVelocity,
    velocityDelta,
    bracket: b.bracket,
    bracketLabel: b.label,
    bracketCycleLow: b.cycleLow,
    bracketCycleHigh: b.cycleHigh,
    bracketCycleMedian: b.cycleMedian,
    bracketWinRate: b.winRate,
    cycleStatus,
    cycleDeltaDays,
    winRateStatus,
    winRateDelta,
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

export function fmtUsdPrecise(value: number): string {
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function cycleStatusLabel(status: CycleStatus): string {
  if (status === "fast") return "Faster than benchmark";
  if (status === "within") return "Within benchmark range";
  return "Slower than benchmark";
}

export function winRateStatusLabel(status: WinRateStatus): string {
  if (status === "above") return "Above benchmark";
  if (status === "at") return "At benchmark";
  return "Below benchmark";
}
