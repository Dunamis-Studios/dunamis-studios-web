import { Resend } from "resend";
import {
  REVENUE_LABELS,
  fmtUsd,
  spendStatusLabel,
  toolCountStatusLabel,
  type OverlapCategory,
  type TechStackCostAuditInputs,
  type TechStackCostAuditResults,
  type ToolFinancials,
} from "./tech-stack-cost-audit-logic";

/**
 * Transactional email for /tools/tech-stack-cost-audit. Same dark-card
 * template family as the other /tools emails. No product CTA. Body
 * restates the canonical inputs, headline spend, license waste, the
 * top consolidation opportunities, and the underutilized tool list.
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
  inputs: TechStackCostAuditInputs;
  results: TechStackCostAuditResults;
}

export async function sendTechStackCostAuditReportEmail({
  to,
  inputs,
  results,
}: SendArgs): Promise<void> {
  const subject = `Your tech stack audit: ${fmtUsd(results.totalAnnualSpend)} annual, ${fmtUsd(results.totalConsolidationSavings)} potential savings`;

  const text = [
    "Here is the tech stack cost audit you generated on dunamisstudios.net.",
    "",
    "Top-line numbers:",
    `  Total annual SaaS spend: ${fmtUsd(results.totalAnnualSpend)}`,
    `  Spend per employee: ${fmtUsd(results.spendPerEmployee)} (benchmark for ${REVENUE_LABELS[inputs.revenueRange]}: ${fmtUsd(results.benchmarkSpendPerEmployee)}, ${spendStatusLabel(results.spendStatus).toLowerCase()})`,
    `  License waste estimate (Zylo 46% rate): ${fmtUsd(results.licenseWasteEstimate)}`,
    `  Tool count: ${results.totalToolCount} (${toolCountStatusLabel(results.toolCountStatus).toLowerCase()})`,
    `  Total potential consolidation savings: ${fmtUsd(results.totalConsolidationSavings)}`,
    "",
    "Top 3 consolidation opportunities:",
    ...renderConsolidationsText(results.topConsolidationOpportunities),
    "",
    `Underutilized tools (${results.underutilizedTools.length}, ${fmtUsd(results.underutilizedAnnualSpend)} annual):`,
    ...(results.underutilizedTools.length > 0
      ? results.underutilizedTools.map(
          (t) =>
            `  ${t.name} (${t.categoryLabel}, ${t.usageLabel}): ${fmtUsd(t.annualCost)}`,
        )
      : ["  None flagged. All tools have Daily, Weekly, or Monthly usage."]),
    "",
    "Where the benchmarks come from:",
    "Tool count and spend benchmarks come from the Zylo 2026 SaaS Management Index: enterprise organizations average 106 apps and $20.6M in annual SaaS spend, with median license utilization at 54% (so 46% of license spend goes unused). BetterCloud reports the same 106 average and notes 33% of SaaS portfolios were consolidated in 2025.",
    "Sales-team tool count benchmarks come from Cleed's 2026 sales-tech roundup: average sales teams use 10 to 15 tools, consolidated leaders target 6, and consolidated teams report 43% higher win rates. 50% of sellers describe their stack as overwhelming.",
    "Zylo also reports typical savings from consolidating overlap categories of $477K to $2.8M for mid-market and enterprise teams.",
    "",
    "Dunamis model assumptions:",
    "License waste estimate uses the flat Zylo 46% rate applied to total annual spend, not a per-tool calculation, because the published benchmark is portfolio-level.",
    "Overlap savings estimate keeps the highest-usage tool in each duplicated category and recovers 50% of the cost of the others. Consolidation never recovers 100% because the keeper has to absorb migrated workflows.",
    "Underutilized = tools marked Rarely or Unknown. Daily, Weekly, and Monthly are treated as in active use, even though Monthly is on the edge.",
    "Spend-per-employee benchmarks are extrapolated from Zylo's enterprise figure (~$20K per employee at $50M+ revenue). Smaller revenue brackets scale down with industry-typical SaaS-density observations.",
    "",
    "These are directional estimates. Calibrate against your actual license utilization data once you pull it from each vendor's admin console.",
    "",
    "Questions? Reply to this email or write to josh@dunamisstudios.net.",
    "",
    "Dunamis Studios",
  ].join("\n");

  const consolidationRows = renderConsolidationsHtml(
    results.topConsolidationOpportunities,
  );
  const underutilizedRows = renderUnderutilizedHtml(results.underutilizedTools);
  const allToolsRows = renderAllToolsHtml(results.toolsByAnnualCost);

  const spendColor =
    results.spendStatus === "above"
      ? "#e0726a"
      : results.spendStatus === "below"
        ? "#7ec77a"
        : "#cfcfcf";
  const toolCountColor =
    results.toolCountStatus === "bloated"
      ? "#e0726a"
      : results.toolCountStatus === "lean"
        ? "#7ec77a"
        : "#cfcfcf";

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:680px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Here is the tech stack cost audit you generated on dunamisstudios.net.</p>

    <div style="margin-top:24px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Headline numbers</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;">Total annual SaaS spend</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:#eaeaea;font-weight:500;">${escapeHtml(fmtUsd(results.totalAnnualSpend))}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Spend per employee</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:${spendColor};">${escapeHtml(fmtUsd(results.spendPerEmployee))}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Benchmark (${escapeHtml(REVENUE_LABELS[inputs.revenueRange])})</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${escapeHtml(fmtUsd(results.benchmarkSpendPerEmployee))}</td></tr>
        <tr><td style="padding:6px 0;color:#888;border-top:1px solid #262626;">License waste estimate (Zylo 46%)</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:#e0726a;font-weight:500;border-top:1px solid #262626;">${escapeHtml(fmtUsd(results.licenseWasteEstimate))}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Total potential consolidation savings</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:#7ec77a;font-weight:500;">${escapeHtml(fmtUsd(results.totalConsolidationSavings))}</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Tool count vs benchmark</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#888;">Your tool count</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:${toolCountColor};font-weight:500;">${results.totalToolCount} (${escapeHtml(toolCountStatusLabel(results.toolCountStatus).toLowerCase())})</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Enterprise avg (Zylo)</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${results.enterpriseAvgToolCount}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Sales-team avg (Cleed)</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${results.salesTeamAvgLow} to ${results.salesTeamAvgHigh}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Consolidated leaders target</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${results.consolidatedTargetToolCount}</td></tr>
      </table>
    </div>

    ${
      results.topConsolidationOpportunities.length > 0
        ? `<div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Top consolidation opportunities</div>
      ${consolidationRows}
    </div>`
        : ""
    }

    ${
      results.underutilizedTools.length > 0
        ? `<div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Underutilized tools (Rarely or Unknown usage)</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">${underutilizedRows}</table>
      <p style="font-size:12px;color:#888;margin:10px 0 0;">Combined annual spend on underutilized tools: ${escapeHtml(fmtUsd(results.underutilizedAnnualSpend))}.</p>
    </div>`
        : ""
    }

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Full tool list (sorted by annual cost)</div>
      <table style="width:100%;font-size:13px;color:#cfcfcf;border-collapse:collapse;">${allToolsRows}</table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Where the benchmarks come from</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Spend and tool-count benchmarks.</span> Zylo 2026 SaaS Management Index: enterprise organizations average 106 apps and $20.6M annual SaaS spend, with median license utilization at 54% (so 46% of spend is unused). BetterCloud reports the same 106 average and notes 33% of SaaS portfolios were consolidated in 2025.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Sales-team benchmarks.</span> Cleed 2026 sales-tech roundup: average sales teams use 10 to 15 tools, consolidated leaders target 6, consolidated teams report 43% higher win rates, and 50% of sellers describe their stack as overwhelming.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Consolidation savings.</span> Zylo reports typical savings from consolidating overlap categories of $477K to $2.8M for mid-market and enterprise teams.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;"><span style="color:#eaeaea;font-weight:500;">Dunamis model assumptions.</span> License waste = total annual spend x 0.46 (Zylo non-utilization rate, applied flat because the published benchmark is portfolio-level). Overlap savings = 50% of cost of all but the highest-usage tool in each duplicated category, on the assumption that the keeper absorbs migrated workflows. Underutilized = Rarely or Unknown usage. Spend-per-employee benchmarks are extrapolated from Zylo&#39;s enterprise figure for smaller revenue brackets.</p>
    </div>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:18px;">These are directional estimates. Calibrate against your actual license utilization data once you pull it from each vendor&#39;s admin console.</p>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Questions? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#a89bff;">josh@dunamisstudios.net</a>.<br><br>
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[stack-audit-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[stack-audit-email] send failed", error);
    throw new Error("Failed to send tech stack cost audit email");
  }
}

function renderConsolidationsText(opps: OverlapCategory[]): string[] {
  if (opps.length === 0) {
    return ["  None. No category has 2+ tools."];
  }
  const lines: string[] = [];
  opps.forEach((o, i) => {
    lines.push(
      `  ${i + 1}. ${o.categoryLabel}: ${fmtUsd(o.estimatedAnnualSavings)} potential savings. Keep ${o.recommendedKeeper}; review ${o.tools.length - 1} other ${o.tools.length - 1 === 1 ? "tool" : "tools"}.`,
    );
    for (const t of o.tools) {
      const tag = t.name === o.recommendedKeeper ? " (keep)" : "";
      lines.push(
        `       ${t.name} (${t.usageLabel}, ${fmtUsd(t.annualCost)})${tag}`,
      );
    }
  });
  return lines;
}

function renderConsolidationsHtml(opps: OverlapCategory[]): string {
  return opps
    .map(
      (o, i) => `<div style="${i > 0 ? "margin-top:14px;padding-top:14px;border-top:1px solid #1a1a1a;" : ""}">
  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:14px;">
    <div style="color:#eaeaea;font-weight:500;">${i + 1}. ${escapeHtml(o.categoryLabel)} (${o.tools.length} tools)</div>
    <div style="color:#7ec77a;font-family:Menlo,Consolas,monospace;font-weight:500;white-space:nowrap;">${escapeHtml(fmtUsd(o.estimatedAnnualSavings))}</div>
  </div>
  <div style="font-size:12px;color:#888;margin-top:4px;">Keep ${escapeHtml(o.recommendedKeeper)}. Review the ${o.tools.length - 1} other ${o.tools.length - 1 === 1 ? "tool" : "tools"} for replacement.</div>
  <table style="width:100%;font-size:13px;color:#cfcfcf;border-collapse:collapse;margin-top:8px;">
    ${o.tools
      .map(
        (t) => `<tr>
      <td style="padding:3px 0;color:${t.name === o.recommendedKeeper ? "#7ec77a" : "#cfcfcf"};">${escapeHtml(t.name)}${t.name === o.recommendedKeeper ? " (keep)" : ""}</td>
      <td style="padding:3px 8px;color:#888;text-align:left;">${escapeHtml(t.usageLabel)}</td>
      <td style="padding:3px 0;font-family:Menlo,Consolas,monospace;text-align:right;">${escapeHtml(fmtUsd(t.annualCost))}</td>
    </tr>`,
      )
      .join("")}
  </table>
</div>`,
    )
    .join("");
}

function renderUnderutilizedHtml(tools: ToolFinancials[]): string {
  return tools
    .map(
      (t) => `<tr>
  <td style="padding:5px 0;color:#cfcfcf;">${escapeHtml(t.name)}</td>
  <td style="padding:5px 8px;color:#888;font-size:12px;">${escapeHtml(t.categoryLabel)}</td>
  <td style="padding:5px 8px;color:#e0726a;font-size:12px;">${escapeHtml(t.usageLabel)}</td>
  <td style="padding:5px 0;font-family:Menlo,Consolas,monospace;text-align:right;">${escapeHtml(fmtUsd(t.annualCost))}</td>
</tr>`,
    )
    .join("");
}

function renderAllToolsHtml(tools: ToolFinancials[]): string {
  return tools
    .map(
      (t) => `<tr>
  <td style="padding:4px 0;color:#cfcfcf;">${escapeHtml(t.name)}</td>
  <td style="padding:4px 8px;color:#888;font-size:12px;">${escapeHtml(t.categoryLabel)}</td>
  <td style="padding:4px 8px;color:#888;font-size:12px;">${escapeHtml(t.usageLabel)}</td>
  <td style="padding:4px 0;font-family:Menlo,Consolas,monospace;text-align:right;">${escapeHtml(fmtUsd(t.annualCost))}</td>
</tr>`,
    )
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
