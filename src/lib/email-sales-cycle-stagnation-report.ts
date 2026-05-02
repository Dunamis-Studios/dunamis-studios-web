import { Resend } from "resend";
import {
  cycleStatusLabel,
  fmtUsd,
  fmtUsdPrecise,
  winRateStatusLabel,
  type SalesCycleStagnationInputs,
  type SalesCycleStagnationResults,
} from "./sales-cycle-stagnation-logic";

/**
 * Transactional email for /tools/sales-cycle-stagnation-calculator.
 * Same dark-card template family as the other /tools emails. No
 * product CTA. Body restates the canonical inputs, the at-risk
 * dollar values, the velocity comparison, and the methodology with
 * named sources.
 */

let resend: Resend | null = null;

function client(): Resend {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  resend = new Resend(key);
  return resend;
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "hello@dunamisstudios.net";
}

function redactEmail(addr: string): string {
  const at = addr.indexOf("@");
  if (at < 1) return "[redacted]";
  const local = addr.slice(0, at);
  const domain = addr.slice(at);
  const head = local.length > 1 ? local[0] : "";
  return `${head}***${domain}`;
}

interface SendArgs {
  to: string;
  inputs: SalesCycleStagnationInputs;
  results: SalesCycleStagnationResults;
}

export async function sendSalesCycleStagnationReportEmail({
  to,
  inputs,
  results,
}: SendArgs): Promise<void> {
  const subject = `Your stalled-pipeline analysis: ${fmtUsd(results.pipelineValueAtRisk)} at risk`;

  const text = [
    "Here is the stalled-pipeline analysis you generated on dunamisstudios.net.",
    "",
    "Your inputs:",
    `  Average deal size: ${fmtUsd(inputs.avgDealSize)}`,
    `  Average sales cycle: ${inputs.avgCycleLength} days`,
    `  Pipeline stages: ${inputs.numStages}`,
    `  Active deals: ${inputs.activeDeals.toLocaleString("en-US")}`,
    `  Total pipeline value: ${fmtUsd(results.effectivePipelineValue)}${inputs.totalPipelineValueOverride === null ? " (auto-calculated)" : ""}`,
    `  Win rate: ${inputs.winRatePct}%`,
    `  Average stage time: ${results.effectiveStageTime.toFixed(1)} days${inputs.avgStageTimeOverride === null ? " (auto-calculated)" : ""}`,
    `  Deals stuck 2x+ stage time: ${inputs.dealsAtRisk}`,
    `  Deals stuck 3x+ stage time: ${inputs.dealsCritical}`,
    "",
    "At-risk pipeline:",
    `  Pipeline value at risk (deals stuck 2x+): ${fmtUsd(results.pipelineValueAtRisk)}`,
    `  Pipeline value critically at risk (deals stuck 3x+): ${fmtUsd(results.pipelineValueCritical)}`,
    `  Daily revenue lost per stalled deal: ${fmtUsdPrecise(results.dailyRevenueLostPerStalledDeal)}`,
    `  Total daily bleed across all stalled deals: ${fmtUsdPrecise(results.totalDailyBleed)}`,
    "",
    "Pipeline velocity:",
    `  Your velocity: ${fmtUsdPrecise(results.pipelineVelocity)} per day`,
    `  Benchmark velocity for your bracket: ${fmtUsdPrecise(results.benchmarkVelocity)} per day`,
    `  Delta: ${results.velocityDelta >= 0 ? "+" : ""}${fmtUsdPrecise(results.velocityDelta)} per day`,
    "",
    `Bracket: ${results.bracketLabel}`,
    `  Cycle benchmark: ${results.bracketCycleLow} to ${results.bracketCycleHigh} days, median ${results.bracketCycleMedian} days`,
    `  Your cycle: ${inputs.avgCycleLength} days (${cycleStatusLabel(results.cycleStatus).toLowerCase()}, ${results.cycleDeltaDays >= 0 ? "+" : ""}${results.cycleDeltaDays} days vs median)`,
    `  Win rate benchmark: ${results.bracketWinRate}%`,
    `  Your win rate: ${inputs.winRatePct}% (${winRateStatusLabel(results.winRateStatus).toLowerCase()}, ${results.winRateDelta >= 0 ? "+" : ""}${results.winRateDelta.toFixed(1)} points vs benchmark)`,
    "",
    "Where the numbers come from:",
    "Cycle benchmarks (deal-size brackets and ranges) are from Optifai's 2025 sales-cycle benchmark roundup: SMB under $15K closes in 14 to 30 days, mid-market $15K to $100K closes in 30 to 90 days, enterprise $100K+ closes in 90 to 180 days, with an overall median of 84 days across B2B SaaS.",
    "Win-rate benchmarks (35% SMB, 30% mid-market, 25% enterprise) are from Digital Bloom's 2025 sales-stats roundup.",
    "Pipeline velocity formula (Opps x Deal Size x Win Rate / Cycle Length = Revenue per Day) is the standard sales operations definition. Benchmark velocity uses your active deal count and deal size, swapping in the bracket median cycle and bracket benchmark win rate, so the delta isolates cycle and win-rate gaps.",
    "",
    "Dunamis model assumptions:",
    "2x average stage time is our at-risk threshold. 3x is the critical threshold. These thresholds are heuristics that surface deals worth manually reviewing; calibrate against your actual stage-aging report if you have months of historical data.",
    "Average stage time defaults to cycle length divided by number of stages, which assumes even time per stage. Late-funnel stages typically run longer than early-funnel; override the auto value with your actual median per-stage time if you have it.",
    "Pipeline value at risk uses dealSize x winRate, treating each stalled deal at its expected value. The critical figure is a subset of the at-risk figure (deals stuck 3x+ are also stuck 2x+).",
    "",
    "These are directional estimates based on industry research. Your actual numbers will vary. Adjust the inputs to match your portal and the output recalculates.",
    "",
    "Questions? Reply to this email or write to josh@dunamisstudios.net.",
    "",
    "Dunamis Studios",
  ].join("\n");

  const cycleColor =
    results.cycleStatus === "within"
      ? "#7ec77a"
      : results.cycleStatus === "fast"
        ? "#7ec77a"
        : "#e0726a";
  const winRateColor =
    results.winRateStatus === "above"
      ? "#7ec77a"
      : results.winRateStatus === "at"
        ? "#cfcfcf"
        : "#e0726a";
  const velocityColor = results.velocityDelta >= 0 ? "#7ec77a" : "#e0726a";

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:640px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Here is the stalled-pipeline analysis you generated on dunamisstudios.net.</p>

    <div style="margin-top:24px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">At-risk pipeline</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;">Pipeline value at risk (2x+)</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:#e0726a;font-weight:500;">${escapeHtml(fmtUsd(results.pipelineValueAtRisk))}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Critically at risk (3x+)</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:#e0726a;font-weight:500;">${escapeHtml(fmtUsd(results.pipelineValueCritical))}</td></tr>
        <tr><td style="padding:6px 0;color:#888;border-top:1px solid #262626;">Daily revenue lost per stalled deal</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;border-top:1px solid #262626;">${escapeHtml(fmtUsdPrecise(results.dailyRevenueLostPerStalledDeal))}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Total daily bleed across stalled deals</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${escapeHtml(fmtUsdPrecise(results.totalDailyBleed))}</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Pipeline velocity</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;">Your velocity (per day)</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${escapeHtml(fmtUsdPrecise(results.pipelineVelocity))}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Benchmark velocity (per day)</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${escapeHtml(fmtUsdPrecise(results.benchmarkVelocity))}</td></tr>
        <tr><td style="padding:6px 0;color:#888;border-top:1px solid #262626;">Delta</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:${velocityColor};font-weight:500;border-top:1px solid #262626;">${results.velocityDelta >= 0 ? "+" : ""}${escapeHtml(fmtUsdPrecise(results.velocityDelta))}</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Bracket comparison</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;">Your bracket</td><td style="text-align:right;">${escapeHtml(results.bracketLabel)}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Cycle benchmark</td><td style="text-align:right;">${results.bracketCycleLow} to ${results.bracketCycleHigh} days (median ${results.bracketCycleMedian})</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Your cycle</td><td style="text-align:right;color:${cycleColor};font-weight:500;">${inputs.avgCycleLength} days (${escapeHtml(cycleStatusLabel(results.cycleStatus).toLowerCase())})</td></tr>
        <tr><td style="padding:6px 0;color:#888;border-top:1px solid #262626;">Win-rate benchmark</td><td style="text-align:right;border-top:1px solid #262626;">${results.bracketWinRate}%</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Your win rate</td><td style="text-align:right;color:${winRateColor};font-weight:500;">${inputs.winRatePct}% (${escapeHtml(winRateStatusLabel(results.winRateStatus).toLowerCase())})</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Your inputs</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#888;">Average deal size</td><td style="text-align:right;">${escapeHtml(fmtUsd(inputs.avgDealSize))}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Sales cycle</td><td style="text-align:right;">${inputs.avgCycleLength} days</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Pipeline stages</td><td style="text-align:right;">${inputs.numStages}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Active deals</td><td style="text-align:right;">${inputs.activeDeals.toLocaleString("en-US")}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Total pipeline value</td><td style="text-align:right;">${escapeHtml(fmtUsd(results.effectivePipelineValue))}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Win rate</td><td style="text-align:right;">${inputs.winRatePct}%</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Average stage time</td><td style="text-align:right;">${results.effectiveStageTime.toFixed(1)} days</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Deals stuck 2x+ stage time</td><td style="text-align:right;">${inputs.dealsAtRisk}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Deals stuck 3x+ stage time</td><td style="text-align:right;">${inputs.dealsCritical}</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Where the numbers come from</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Cycle benchmarks.</span> Optifai 2025 sales-cycle benchmark roundup: SMB under $15K closes in 14 to 30 days, mid-market $15K to $100K closes in 30 to 90 days, enterprise $100K+ closes in 90 to 180 days. Overall B2B SaaS median is 84 days.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Win-rate benchmarks.</span> Digital Bloom 2025 sales-stats roundup: 35% for SMB, 30% for mid-market, 25% for enterprise.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Pipeline velocity formula.</span> Opportunities x Deal Size x Win Rate / Cycle Length = Revenue per Day, the standard sales operations definition. Benchmark velocity holds your deal count and deal size constant and swaps in the bracket median cycle and benchmark win rate, so the delta isolates cycle and win-rate gaps from scale.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;"><span style="color:#eaeaea;font-weight:500;">Dunamis model assumptions.</span> 2x average stage time is the at-risk threshold; 3x is critical. Stage time defaults to cycle length divided by number of stages, which assumes even time per stage. Override the auto value with your actual median per-stage time if you have it.</p>
    </div>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:18px;">These are directional estimates. Calibrate the at-risk and critical thresholds against your actual stage-aging report once you have a few months of historical data on which stalled deals actually closed.</p>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Questions? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#a89bff;">josh@dunamisstudios.net</a>.<br><br>
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[stagnation-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
    );
    return;
  }

  const { error } = await client().emails.send({
    from: `Dunamis Studios <${fromAddress()}>`,
    to,
    subject,
    html,
    text,
  });
  if (error) {
    console.error("[stagnation-email] send failed", error);
    throw new Error("Failed to send sales-cycle stagnation report email");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
