import { Resend } from "resend";
import {
  ANSWER_LABELS,
  type AuditAnswers,
  type AuditResults,
} from "./property-audit-scoring";

/**
 * Transactional email for "Email me this report" submissions on
 * /tools/property-audit-checklist. Same template family as the
 * handoff calculator email (dark theme, single-card layout) so the
 * /tools surfaces feel coherent in the visitor's inbox.
 *
 * Degrades gracefully when RESEND_API_KEY is unset: the caller has
 * already persisted the row to Redis, so the audit lead survives even
 * when the email send is skipped in local dev.
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

function answerLine(answers: AuditAnswers): string[] {
  return [
    `Custom contact properties: ${answers.customPropertyCount.toLocaleString("en-US")}`,
    `Portal age: ${ANSWER_LABELS.portalAge[answers.portalAge]}`,
    `Naming convention: ${ANSWER_LABELS.triState[answers.namingConvention]}`,
    `Descriptions filled: ${ANSWER_LABELS.fillCoverage[answers.descriptionsFilled]}`,
    `Last full audit: ${ANSWER_LABELS.auditRecency[answers.lastAudit]}`,
    `Properties under 5% fill rate: ${ANSWER_LABELS.lowFillCount[answers.lowFillRateCount]}`,
    `Duplicate properties: ${ANSWER_LABELS.duplicateState[answers.duplicates]}`,
    `Owners assigned: ${ANSWER_LABELS.triState[answers.ownersAssigned]}`,
    `Creation review cadence: ${ANSWER_LABELS.creationCadence[answers.reviewCadence]}`,
    `Past property-driven incidents: ${ANSWER_LABELS.incidentCount[answers.pastIncidents]}`,
  ];
}

interface SendArgs {
  to: string;
  answers: AuditAnswers;
  results: AuditResults;
}

export async function sendPropertyAuditReportEmail({
  to,
  answers,
  results,
}: SendArgs): Promise<void> {
  const subject = `Your HubSpot property audit: ${results.totalScore}/100 (${results.tier})`;

  const text = [
    "Here is your HubSpot property audit checklist score.",
    "",
    `Score: ${results.totalScore}/100`,
    `Tier: ${results.tier}`,
    `${results.tierBlurb}`,
    "",
    "Your answers:",
    ...answerLine(answers).map((l) => `  ${l}`),
    "",
    "Per-question scores (out of 10):",
    ...results.perQuestion.map((q) => `  ${q.label}: ${q.score}`),
    "",
    "Your top 3 priority actions:",
    ...results.topActions.flatMap((a, i) => [
      `${i + 1}. ${a.title}`,
      `   ${a.body}`,
    ]),
    "",
    "How we scored this:",
    "Each of ten questions contributes 0 to 10 points to a 0 to 100 score. Higher scores reward documented practice (naming conventions, descriptions, owners, review cadence) and active hygiene (recent audit, visibility into fill rate, fewer duplicates and incidents). Lower scores flag drift and bloat. We surface your three lowest-scoring questions as priority actions so the punch list is yours, not generic.",
    "",
    "Industry sourcing and our model:",
    "HubSpot's per-tier custom property cap is 100 to 1,000+ depending on Hub level (HubSpot product limits). The 50, 150, and 300 thresholds we use to score property count are calibrated against the portals Dunamis Studios has audited, not a published benchmark. The 5% fill-rate cutoff and the four-tier breakpoints (80/50/20) are our model assumptions, not industry standards.",
    "",
    "These are directional estimates. Your actual numbers will vary. Re-take the assessment after each round of cleanup to track progress.",
    "",
    "Questions? Reply to this email or write to josh@dunamisstudios.net.",
    "",
    "Dunamis Studios",
  ].join("\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Here is your HubSpot property audit checklist score.</p>

    <div style="margin-top:24px;padding:22px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;text-align:center;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:6px;">Cleanliness score</div>
      <div style="font-family:Georgia,serif;font-size:48px;font-weight:500;letter-spacing:-0.02em;color:#eaeaea;line-height:1;">${results.totalScore}<span style="font-size:24px;color:#888;"> / 100</span></div>
      <div style="margin-top:10px;font-size:14px;font-weight:500;color:${tierColor(results.tier)};">${results.tier}</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:10px 0 0;">${escapeHtml(results.tierBlurb)}</p>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Top 3 priority actions</div>
      <ol style="margin:0;padding:0 0 0 18px;font-size:14px;color:#cfcfcf;line-height:1.6;">
        ${results.topActions
          .map(
            (a) =>
              `<li style="margin-bottom:12px;"><div style="color:#eaeaea;font-weight:500;">${escapeHtml(a.title)}</div><div style="color:#a1a1a1;font-size:13px;margin-top:4px;">${escapeHtml(a.body)}</div></li>`,
          )
          .join("")}
      </ol>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Your answers</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        ${answerLine(answers)
          .map((line) => {
            const idx = line.indexOf(":");
            const label = idx > 0 ? line.slice(0, idx) : line;
            const value = idx > 0 ? line.slice(idx + 1).trim() : "";
            return `<tr><td style="padding:4px 0;color:#888;">${escapeHtml(label)}</td><td style="text-align:right;">${escapeHtml(value)}</td></tr>`;
          })
          .join("")}
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">How we scored this</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;">Each of ten questions contributes 0 to 10 points to a 0 to 100 score. Higher scores reward documented practice (naming conventions, descriptions, owners, review cadence) and active hygiene (recent audit, visibility into fill rate, fewer duplicates and incidents). Lower scores flag drift and bloat.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;">We surface your three lowest-scoring questions as priority actions so the punch list is yours, not generic.</p>
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin:14px 0 10px;">Industry sourcing and our model</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;">HubSpot's per-tier custom property cap is 100 to 1,000+ depending on Hub level. The 50, 150, and 300 thresholds we use to score property count are calibrated against the portals Dunamis Studios has audited, not a published benchmark. The 5% fill-rate cutoff and the four-tier breakpoints (80/50/20) are our model assumptions, not industry standards.</p>
    </div>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:18px;">These are directional estimates. Your actual numbers will vary. Re-take the assessment after each round of cleanup to track progress.</p>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Questions? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#a89bff;">josh@dunamisstudios.net</a>.<br><br>
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[property-audit-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[property-audit-email] send failed", error);
    throw new Error("Failed to send property audit report email");
  }
}

function tierColor(tier: AuditResults["tier"]): string {
  switch (tier) {
    case "Clean":
      return "#7ec77a";
    case "Drift":
      return "#d3c66a";
    case "Bloat":
      return "#e09c5a";
    case "Crisis":
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
