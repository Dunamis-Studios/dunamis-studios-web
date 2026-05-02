import { Resend } from "resend";
import {
  ANSWER_LABELS,
  capStatusLabel,
  type WorkflowAuditAnswers,
  type WorkflowAuditResults,
} from "./workflow-audit-scoring";

/**
 * Transactional email for /tools/workflow-audit-checklist. Same dark-card
 * template family as the other /tools emails. No product CTA. Body
 * restates the canonical inputs, score, tier verdict, cap utilization
 * vs published HubSpot tier limit, and the top three prioritized
 * actions.
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
  answers: WorkflowAuditAnswers;
  results: WorkflowAuditResults;
}

export async function sendWorkflowAuditReportEmail({
  to,
  answers,
  results,
}: SendArgs): Promise<void> {
  const subject = `Your workflow audit: ${results.totalScore}/100, tier ${results.tier} (${results.capUtilization.utilizationPct}% of cap)`;

  const text = [
    "Here is the workflow audit you generated on dunamisstudios.net.",
    "",
    `Workflow health score: ${results.totalScore} / 100`,
    `Tier: ${results.tier}`,
    `Verdict: ${results.tierBlurb}`,
    "",
    `HubSpot tier: ${ANSWER_LABELS.tier[answers.tier]}`,
    `Active workflow utilization: ${results.capUtilization.headline}`,
    "",
    "Per-question breakdown:",
    ...results.perQuestion.map(
      (q) => `  ${q.label}: ${q.score} / ${q.maxScore}`,
    ),
    "",
    "Top 3 prioritized actions:",
    ...results.topActions.flatMap((a, i) => [
      `  ${i + 1}. ${a.title}`,
      `     ${a.body}`,
    ]),
    "",
    "Where the benchmarks come from:",
    "Active workflow limits per HubSpot tier are pulled from HubSpot's published product-limits documentation: 300 on Marketing Hub Professional, 1,000 on Marketing Hub Enterprise, 400 on Operations Hub Starter, and 1,100 on Operations Hub Enterprise. Operations Hub Professional is set to 1,000 to match the standard mid-tier cap.",
    "Quarterly audit cadence is the consensus across HubSpot agency operators (Daeda, JetStack AI, and others). Portals that audit annually accumulate drift faster than they can ship new automation.",
    "Common conflict patterns (lifecycle stage overwrites, re-enrollment loops, conflicting delays, archived list references) are documented in Daeda's HubSpot workflow conflict guide and JetStack AI's audit checklist.",
    "",
    "Dunamis model assumptions:",
    "Approaching cap = 80%+ of tier limit. Critical = 95%+ of tier limit. These thresholds are heuristics that flag portals worth manually reviewing for active workflow consolidation.",
    "Scoring weights: ownership and documentation 30% (naming, owners, descriptions), conflict signals 30% (duplicate property writers, archived references, re-enrollment intent), audit cadence 20%, recent incidents 20%. Cadence and incidents are double-weighted because they correlate with downstream impact more reliably than any single hygiene signal.",
    "",
    "Re-run the assessment after each quarterly audit to track score movement.",
    "",
    "Questions? Reply to this email or write to josh@dunamisstudios.net.",
    "",
    "Dunamis Studios",
  ].join("\n");

  const tierColor = tierColorFor(results.tier);
  const capColor = capColorFor(results.capUtilization.status);

  const perQuestionRows = results.perQuestion
    .map(
      (q) => `<tr>
  <td style="padding:5px 0;color:#cfcfcf;font-size:14px;">${escapeHtml(q.label)}</td>
  <td style="padding:5px 0;font-family:Menlo,Consolas,monospace;text-align:right;color:${q.score === q.maxScore ? "#7ec77a" : q.score === 0 ? "#e0726a" : "#cfcfcf"};">${q.score} / ${q.maxScore}</td>
</tr>`,
    )
    .join("");

  const actionsHtml = results.topActions
    .map(
      (a, i) => `<div style="${i > 0 ? "margin-top:14px;padding-top:14px;border-top:1px solid #1a1a1a;" : ""}">
  <div style="font-size:14px;color:#eaeaea;font-weight:500;">${i + 1}. ${escapeHtml(a.title)}</div>
  <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:6px 0 0;">${escapeHtml(a.body)}</p>
</div>`,
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:640px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Here is the workflow audit you generated on dunamisstudios.net.</p>

    <div style="margin-top:24px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Workflow health score</div>
      <div style="display:flex;align-items:baseline;gap:12px;">
        <div style="font-family:Georgia,serif;font-size:48px;font-weight:500;letter-spacing:-0.02em;color:${tierColor};">${results.totalScore}</div>
        <div style="font-size:13px;color:#888;">/ 100</div>
        <div style="margin-left:auto;font-size:13px;color:${tierColor};font-weight:500;">${escapeHtml(results.tier)}</div>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:10px 0 0;">${escapeHtml(results.tierBlurb)}</p>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Active workflow utilization</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:5px 0;color:#888;">HubSpot tier</td><td style="text-align:right;">${escapeHtml(ANSWER_LABELS.tier[answers.tier])}</td></tr>
        <tr><td style="padding:5px 0;color:#888;">Active workflows</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${results.capUtilization.totalActiveWorkflows.toLocaleString("en-US")}</td></tr>
        <tr><td style="padding:5px 0;color:#888;">Tier limit</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${results.capUtilization.activeWorkflowLimit.toLocaleString("en-US")}</td></tr>
        <tr><td style="padding:5px 0;color:#888;border-top:1px solid #262626;">Utilization</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:${capColor};font-weight:500;border-top:1px solid #262626;">${results.capUtilization.utilizationPct}% (${escapeHtml(capStatusLabel(results.capUtilization.status).toLowerCase())})</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Top 3 prioritized actions</div>
      ${actionsHtml}
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Per-question breakdown</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">${perQuestionRows}</table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Where the benchmarks come from</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Tier limits.</span> HubSpot&#39;s published product-limits documentation: 300 active workflows on Marketing Hub Professional, 1,000 on Marketing Hub Enterprise, 400 on Operations Hub Starter, 1,100 on Operations Hub Enterprise. Operations Hub Professional is set to 1,000 to match the standard mid-tier cap.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Audit cadence.</span> Quarterly audit cadence is the consensus across HubSpot agency operators (Daeda, JetStack AI, and others). Portals that audit annually accumulate drift faster than they can ship new automation.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Conflict patterns.</span> Lifecycle stage overwrites, re-enrollment loops, conflicting delays, and archived list references are documented in Daeda&#39;s HubSpot workflow conflict guide and JetStack AI&#39;s audit checklist as the top causes of silently-broken automation.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;"><span style="color:#eaeaea;font-weight:500;">Dunamis model assumptions.</span> Approaching cap at 80%+, critical at 95%+. Scoring weights: ownership and documentation 30%, conflict signals 30%, audit cadence 20%, recent incidents 20%. Cadence and incidents are double-weighted because they correlate with downstream impact more reliably than any single hygiene signal.</p>
    </div>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:18px;">Re-run the assessment after each quarterly audit to track score movement.</p>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Questions? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#a89bff;">josh@dunamisstudios.net</a>.<br><br>
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[workflow-audit-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[workflow-audit-email] send failed", error);
    throw new Error("Failed to send workflow audit report email");
  }
}

function tierColorFor(tier: WorkflowAuditResults["tier"]): string {
  switch (tier) {
    case "Healthy":
      return "#7ec77a";
    case "Drift":
      return "#cfcfcf";
    case "Bloat":
      return "#e0a060";
    case "Crisis":
      return "#e0726a";
  }
}

function capColorFor(status: WorkflowAuditResults["capUtilization"]["status"]): string {
  switch (status) {
    case "lean":
      return "#7ec77a";
    case "moderate":
      return "#cfcfcf";
    case "approaching":
      return "#e0a060";
    case "critical":
      return "#e0726a";
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
