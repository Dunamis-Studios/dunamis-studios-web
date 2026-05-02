import { Resend } from "resend";
import {
  AGE_LABEL,
  TIER_LABEL,
  type BloatInputs,
  type BloatResults,
  type BloatTier,
} from "./bloat-score-scoring";

/**
 * Transactional email for the /tools/hubspot-bloat-score capture.
 * Same dark-card template family as the other /tools emails so the
 * inbox experience reads as a coherent suite. No product CTA.
 *
 * Degrades gracefully when RESEND_API_KEY is unset: the caller has
 * already persisted the row to Redis, so the lead survives without
 * the email send in local dev.
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

function answerLines(inputs: BloatInputs): { label: string; value: string }[] {
  return [
    { label: "Custom contact properties", value: inputs.contactProperties.toLocaleString("en-US") },
    { label: "Custom company properties", value: inputs.companyProperties.toLocaleString("en-US") },
    { label: "Custom deal properties", value: inputs.dealProperties.toLocaleString("en-US") },
    { label: "Active workflows", value: inputs.activeWorkflows.toLocaleString("en-US") },
    { label: "Active lists", value: inputs.activeLists.toLocaleString("en-US") },
    { label: "Total contacts", value: inputs.totalContacts.toLocaleString("en-US") },
    { label: "Portal age", value: AGE_LABEL[inputs.portalAge] },
    { label: "HubSpot tier", value: TIER_LABEL[inputs.tier] },
  ];
}

interface SendArgs {
  to: string;
  inputs: BloatInputs;
  results: BloatResults;
}

export async function sendBloatScoreReportEmail({
  to,
  inputs,
  results,
}: SendArgs): Promise<void> {
  const subject = `Your HubSpot bloat score: ${results.totalScore}/100 (${results.tier})`;

  const text = [
    "Here is your HubSpot Bloat Score breakdown.",
    "",
    `Bloat score: ${results.totalScore}/100 (lower is leaner)`,
    `Tier: ${results.tier}`,
    `${results.tierBlurb}`,
    "",
    "Your inputs:",
    ...answerLines(inputs).map((l) => `  ${l.label}: ${l.value}`),
    "",
    "Per-asset breakdown:",
    ...results.breakdown.flatMap((b) => [
      `  ${b.label} (${statusLabel(b.status)}, contributes ${Math.round(b.contribution)} points)`,
      `    Current: ${b.current}`,
      `    Benchmark: ${b.benchmark}`,
    ]),
    "",
    "Top 3 concentrations:",
    ...results.topConcentrations.flatMap((c, i) => [
      `${i + 1}. ${c.title}`,
      `   ${c.body}`,
    ]),
    "",
    "Where the benchmarks come from:",
    "Custom property caps come from HubSpot's published per-tier product limits: 10 total on Free, 1,000 per object type on Starter, Pro, and Enterprise. Real-world reports place the practical ceiling around 1,100 per object before HubSpot blocks the editor.",
    "Workflow caps come from HubSpot's per-tier limits: Marketing Pro 300, Marketing Enterprise 1,000; Operations Hub Starter 400, Enterprise 1,100. Caps are not additive across hubs.",
    "Active list caps come from HubSpot's per-tier Marketing Hub limits: Starter 25 active and 1,000 static, Pro 1,000 active, Enterprise 1,500 active and 1,500 static.",
    "Vantage Point reports mid-size portals accumulate 300 to 500+ custom properties within 2 years if creation goes unmanaged, and that only 30 to 40 percent of custom properties are actively used in mid-size portals.",
    "Dunamis model assumptions: a healthy custom property count by portal age (about 50 under 1 year, 150 at 1 to 3 years, 300 at 3 to 5 years, 400 at 5+ years) and a 40/25/20/15 weight split across properties, workflows, lists, and asset density per contact.",
    "",
    "Re-take the assessment after each cleanup pass to track progress.",
    "",
    "Questions? Reply to this email or write to josh@dunamisstudios.net.",
    "",
    "Dunamis Studios",
  ].join("\n");

  const breakdownRows = results.breakdown
    .map(
      (b) => `<tr>
  <td style="padding:8px 0;color:#cfcfcf;vertical-align:top;width:35%;">
    <div style="font-weight:500;color:#eaeaea;">${escapeHtml(b.label)}</div>
    <div style="font-size:11px;color:${statusColor(b.status)};text-transform:uppercase;letter-spacing:0.08em;margin-top:2px;">${escapeHtml(statusLabel(b.status))} · +${Math.round(b.contribution)} pts</div>
  </td>
  <td style="padding:8px 0;color:#cfcfcf;vertical-align:top;font-size:13px;">
    <div>${escapeHtml(b.current)}</div>
    <div style="color:#888;margin-top:2px;">${escapeHtml(b.benchmark)}</div>
  </td>
</tr>`,
    )
    .join("");

  const topConcentrationItems = results.topConcentrations
    .map(
      (c) =>
        `<li style="margin-bottom:12px;"><div style="color:#eaeaea;font-weight:500;">${escapeHtml(c.title)}</div><div style="color:#a1a1a1;font-size:13px;margin-top:4px;">${escapeHtml(c.body)}</div></li>`,
    )
    .join("");

  const inputRows = answerLines(inputs)
    .map(
      (l) =>
        `<tr><td style="padding:4px 0;color:#888;">${escapeHtml(l.label)}</td><td style="text-align:right;color:#cfcfcf;">${escapeHtml(l.value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:600px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Here is your HubSpot Bloat Score breakdown.</p>

    <div style="margin-top:24px;padding:22px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;text-align:center;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:6px;">Bloat score</div>
      <div style="font-family:Georgia,serif;font-size:48px;font-weight:500;letter-spacing:-0.02em;color:#eaeaea;line-height:1;">${results.totalScore}<span style="font-size:24px;color:#888;"> / 100</span></div>
      <div style="margin-top:4px;font-size:11px;color:#888;">Lower is leaner</div>
      <div style="margin-top:10px;font-size:14px;font-weight:500;color:${tierColor(results.tier)};">${escapeHtml(results.tier)}</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:10px 0 0;">${escapeHtml(results.tierBlurb)}</p>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Per-asset breakdown</div>
      <table style="width:100%;border-collapse:collapse;">
        ${breakdownRows}
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Top 3 concentrations</div>
      <ol style="margin:0;padding:0 0 0 18px;font-size:14px;color:#cfcfcf;line-height:1.6;">
        ${topConcentrationItems}
      </ol>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Your inputs</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        ${inputRows}
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Where the benchmarks come from</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;">Custom property caps are from HubSpot's published per-tier limits: 10 total on Free, 1,000 per object type on Starter, Pro, and Enterprise. Real-world reports place the practical ceiling around 1,100 per object before the editor blocks new fields.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;">Workflow caps are from HubSpot's per-tier limits: Marketing Pro 300, Marketing Enterprise 1,000; Operations Hub Starter 400, Enterprise 1,100. Caps are not additive across hubs.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;">Active list caps are from HubSpot's per-tier Marketing Hub limits: Starter 25 active and 1,000 static, Pro 1,000 active, Enterprise 1,500 active and 1,500 static.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;">Vantage Point reports mid-size portals accumulate 300 to 500+ custom properties within 2 years if creation goes unmanaged, and that only 30 to 40 percent of custom properties are actively used in mid-size portals.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;">Dunamis model assumptions: a healthy custom property count by portal age (about 50 under 1 year, 150 at 1 to 3 years, 300 at 3 to 5 years, 400 at 5+ years) and a 40/25/20/15 weight split across properties, workflows, lists, and asset density per contact.</p>
    </div>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:18px;">Re-take the assessment after each cleanup pass to track progress.</p>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Questions? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#a89bff;">josh@dunamisstudios.net</a>.<br><br>
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[bloat-score-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[bloat-score-email] send failed", error);
    throw new Error("Failed to send bloat score report email");
  }
}

function tierColor(tier: BloatTier): string {
  switch (tier) {
    case "Lean":
      return "#7ec77a";
    case "Healthy":
      return "#a89bff";
    case "Bloated":
      return "#e09c5a";
    case "Critical":
      return "#e0726a";
  }
}

function statusColor(status: "lean" | "on" | "heavy" | "critical"): string {
  switch (status) {
    case "lean":
      return "#7ec77a";
    case "on":
      return "#888";
    case "heavy":
      return "#e09c5a";
    case "critical":
      return "#e0726a";
  }
}

function statusLabel(status: "lean" | "on" | "heavy" | "critical"): string {
  switch (status) {
    case "lean":
      return "Lean";
    case "on":
      return "On benchmark";
    case "heavy":
      return "Heavy";
    case "critical":
      return "Critical";
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
