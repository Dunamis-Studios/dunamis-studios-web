import { Resend } from "resend";
import {
  LABELS,
  renderModelAsText,
  type LeadScoringInputs,
  type LeadScoringResults,
  type ScoringRule,
} from "./lead-scoring-logic";

/**
 * Transactional email for /tools/lead-scoring-builder. Same dark-card
 * template family as the other /tools emails. No product CTA. Body
 * is dominated by the scoring model in two formats: a structured
 * HTML rendering for readers and a fenced plain-text block for copy-
 * paste into HubSpot's lead-scoring builder.
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
  inputs: LeadScoringInputs;
  results: LeadScoringResults;
}

export async function sendLeadScoringReportEmail({
  to,
  inputs,
  results,
}: SendArgs): Promise<void> {
  const subject = `Your HubSpot lead-scoring model: MQL at ${results.mqlThreshold} (${LABELS.tier[inputs.tier]})`;
  const copyText = renderModelAsText(inputs, results);

  const text = [
    "Here is your HubSpot lead-scoring starter model.",
    "",
    `Tier: ${LABELS.tier[inputs.tier]} (cap ${results.scoreCap})`,
    `Cycle: ${LABELS.cycle[inputs.cycleLength]}`,
    `Fit / Engagement split: ${results.split.fit} / ${results.split.engagement}`,
    `MQL threshold: ${results.mqlThreshold} points`,
    `Decay: ${results.decayRate}, ${results.decayDays} days`,
    "",
    "Copy-paste model below:",
    "",
    copyText,
    "",
    "How point values were chosen:",
    "Demo, free trial, contact form, and pricing point values follow industry-standard lead-scoring practice (demo +25, contact form +20, pricing visit +15). Negative values for free email domains, role mismatch, and competitor domains follow the same standard practice (free email -15, role mismatch -25, competitor -50). The 5x multiplier on Enterprise scales these proportionally to HubSpot's 500-point Enterprise cap.",
    "",
    "Where the recommendations come from:",
    "Score caps are HubSpot's published per-tier limits: 100 points on Marketing Pro, 500 on Marketing Enterprise. The 50/50 Fit/Engagement default is HubSpot's recommended starting split. MQL thresholds typically fall between 50 and 80 on the 100-point scale per common practice; we adjust by sales cycle (60 / 70 / 75 / 80 across our four cycle bands) so shorter cycles can qualify on lighter signals and longer cycles need more accumulated evidence. Decay defaults run 30 to 90 days at 50 percent per month; we map decay to cycle length for the same reason.",
    "",
    "Re-run the builder when ICP, sales cycle, or HubSpot tier changes. The model is a starting point; iterate on point values once you have a few months of data on which leads actually closed.",
    "",
    "Questions? Reply to this email or write to josh@dunamisstudios.net.",
    "",
    "Dunamis Studios",
  ].join("\n");

  const renderRules = (rules: ScoringRule[]): string =>
    rules
      .map(
        (r) =>
          `<tr>
  <td style="padding:6px 8px 6px 0;color:#cfcfcf;font-size:14px;vertical-align:top;width:55%;">
    <div style="color:#eaeaea;">${escapeHtml(r.name)}</div>
    <div style="color:#888;font-size:12px;margin-top:2px;">${escapeHtml(r.description)}</div>
  </td>
  <td style="padding:6px 0;color:${r.points >= 0 ? "#7ec77a" : "#e0726a"};font-family:Menlo,Consolas,monospace;font-size:14px;text-align:right;vertical-align:top;font-weight:500;">${r.points >= 0 ? "+" : ""}${r.points}</td>
</tr>`,
      )
      .join("");

  const tierRows = results.tiers
    .map(
      (t) => `<tr>
  <td style="padding:6px 8px 6px 0;color:#eaeaea;font-weight:500;font-size:14px;vertical-align:top;width:25%;">${t.letter}</td>
  <td style="padding:6px 8px 6px 0;color:#cfcfcf;font-size:14px;vertical-align:top;width:25%;">${escapeHtml(t.label)}</td>
  <td style="padding:6px 8px 6px 0;color:#cfcfcf;font-family:Menlo,Consolas,monospace;font-size:14px;vertical-align:top;width:25%;">${escapeHtml(t.range)}</td>
  <td style="padding:6px 0;color:#888;font-size:13px;vertical-align:top;">${escapeHtml(t.description)}</td>
</tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:640px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Here is your HubSpot lead-scoring starter model.</p>

    <div style="margin-top:24px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Model summary</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#888;">HubSpot tier</td><td style="text-align:right;">${escapeHtml(LABELS.tier[inputs.tier])} (cap ${results.scoreCap})</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Sales cycle</td><td style="text-align:right;">${escapeHtml(LABELS.cycle[inputs.cycleLength])}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Fit / Engagement split</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;">${results.split.fit} / ${results.split.engagement}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">MQL threshold</td><td style="text-align:right;font-family:Menlo,Consolas,monospace;color:#eaeaea;font-weight:500;">${results.mqlThreshold} points</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Score decay</td><td style="text-align:right;">${escapeHtml(results.decayRate)}, ${results.decayDays} days</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Fit scoring (firmographic)</div>
      <table style="width:100%;border-collapse:collapse;">${renderRules(results.fitRules)}</table>
    </div>

    ${
      results.engagementRules.length > 0
        ? `<div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Engagement scoring (positive)</div>
      <table style="width:100%;border-collapse:collapse;">${renderRules(results.engagementRules)}</table>
    </div>`
        : ""
    }

    ${
      results.negativeRules.length > 0
        ? `<div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Negative scoring</div>
      <table style="width:100%;border-collapse:collapse;">${renderRules(results.negativeRules)}</table>
    </div>`
        : ""
    }

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Tier mapping</div>
      <table style="width:100%;border-collapse:collapse;">${tierRows}</table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Copy-paste into HubSpot</div>
      <pre style="margin:0;padding:14px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;font-family:Menlo,Consolas,monospace;font-size:12px;line-height:1.6;color:#cfcfcf;white-space:pre-wrap;overflow-x:auto;">${escapeHtml(copyText)}</pre>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Where the recommendations come from</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;">Score caps are HubSpot's published per-tier limits: 100 on Marketing Pro, 500 on Marketing Enterprise. The 50/50 Fit/Engagement default is HubSpot's recommended starting split. Standard point values follow widely cited industry practice: demo +25, free trial +25, contact form +20, pricing visit +15, role match +10, content download +5. Standard negative values: free email domain -15, role mismatch -25, competitor domain -50.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;">Dunamis model assumptions: MQL thresholds adjust by sales cycle (60 / 70 / 75 / 80 across the four cycle bands) and decay periods adjust the same way (30 / 60 / 90 / 90 days). The Fit/Engagement split also shifts with cycle length, anchored at the HubSpot 50/50 default for the median 30-90 day band.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;">On Enterprise, all point values and the threshold scale 5x to fit the 500-point cap proportionally. Enterprise customers typically extend this baseline with more granular intent rules to use the additional headroom.</p>
    </div>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:18px;">Re-run the builder when ICP, sales cycle, or HubSpot tier changes. The model is a starting point; iterate on point values once you have a few months of data on which leads actually closed.</p>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Questions? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#a89bff;">josh@dunamisstudios.net</a>.<br><br>
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[lead-scoring-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[lead-scoring-email] send failed", error);
    throw new Error("Failed to send lead-scoring report email");
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
