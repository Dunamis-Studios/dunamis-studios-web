import { Resend } from "resend";
import {
  recommendationKindLabel,
  type DecisionTreeAnswers,
  type PathStep,
  type Recommendation,
} from "./custom-object-decision-tree-logic";

/**
 * Transactional email for /tools/custom-object-decision-tree. Same
 * dark-card template family as the other /tools emails. No product
 * CTA. Body restates the path the visitor took, the final
 * recommendation, plain-English explanation, tradeoffs, examples,
 * implementation pointers, and the methodology with named sources.
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
  answers: DecisionTreeAnswers;
  path: PathStep[];
  recommendation: Recommendation;
}

export async function sendCustomObjectDecisionTreeReportEmail({
  to,
  path,
  recommendation,
}: SendArgs): Promise<void> {
  const kindLabel = recommendationKindLabel(recommendation.kind);
  const subject = `Your custom object decision: ${recommendation.title}`;

  const text = [
    "Here is the recommendation from the custom object decision tree on dunamisstudios.net.",
    "",
    `Recommendation: ${kindLabel}`,
    `Headline: ${recommendation.title}`,
    "",
    "Your path:",
    ...path.map((s) => `  ${s.questionLabel}: ${s.answerLabel}`),
    "",
    "Why:",
    recommendation.explanation,
    "",
    "Tradeoffs:",
    ...recommendation.tradeoffs.map((t) => `  - ${t}`),
    "",
    "Common examples:",
    ...recommendation.examples.map((e) => `  - ${e}`),
    "",
    "Implementation pointers:",
    recommendation.implementationPointers,
    "",
    "Where the recommendations come from:",
    "Tier eligibility comes from HubSpot's product KB (custom object availability article, updated April 28, 2026): Custom Objects require Enterprise on any hub. HubDB requires Content Hub Professional or higher. Behavioral and custom events require Marketing Hub Enterprise or Data Hub Enterprise.",
    "Many-to-many relationships that custom properties cannot support is the structural test from Hyphadev's Custom Objects walkthrough.",
    "The facility_1_address, facility_2_address red-flag pattern (and similar repeated-suffix property naming) is from Set2Close's lead-data structure guide.",
    "HubDB is reference and lookup data, not relational; custom events are immutable and multi-occurrence per ProfitPad's HubSpot data primitives breakdown.",
    "Custom object examples (Licenses, Shipments, Partners, Projects) are from RevBlack's HubSpot custom object case studies.",
    "The Pro-tier Repurposed Standard Object workaround is the consensus pattern across HubSpot Community threads from 2025 and 2026; HubSpot has not added Custom Objects to Pro despite repeated requests.",
    "",
    "Dunamis model assumptions:",
    "Frequently changing = updated more than once per quarter on average. Multiple instances = expecting 3+ instances per parent record on average. Both are heuristics that surface the structural decision; calibrate against your actual usage data once it is in HubSpot.",
    "",
    "Re-run the tree if your tier or relationship structure changes.",
    "",
    "Questions? Reply to this email or write to josh@dunamisstudios.net.",
    "",
    "Dunamis Studios",
  ].join("\n");

  const pathRows = path
    .map(
      (s) => `<tr>
  <td style="padding:5px 0;color:#888;font-size:13px;">${escapeHtml(s.questionLabel)}</td>
  <td style="padding:5px 0;color:#cfcfcf;font-size:13px;text-align:right;">${escapeHtml(s.answerLabel)}</td>
</tr>`,
    )
    .join("");

  const tradeoffsHtml = recommendation.tradeoffs
    .map(
      (t) =>
        `<li style="margin:0 0 6px;color:#cfcfcf;font-size:13px;line-height:1.6;">${escapeHtml(t)}</li>`,
    )
    .join("");

  const examplesHtml = recommendation.examples
    .map(
      (e) =>
        `<li style="margin:0 0 4px;color:#cfcfcf;font-size:13px;line-height:1.6;">${escapeHtml(e)}</li>`,
    )
    .join("");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:640px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Here is the recommendation from the custom object decision tree on dunamisstudios.net.</p>

    <div style="margin-top:24px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Recommendation</div>
      <div style="font-family:Georgia,serif;font-size:28px;font-weight:500;letter-spacing:-0.02em;color:#a89bff;line-height:1.2;">${escapeHtml(kindLabel)}</div>
      <div style="margin-top:6px;font-size:14px;color:#cfcfcf;">${escapeHtml(recommendation.title)}</div>
      <p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:#cfcfcf;">${escapeHtml(recommendation.explanation)}</p>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Your path</div>
      <table style="width:100%;border-collapse:collapse;">${pathRows}</table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Tradeoffs</div>
      <ul style="margin:0;padding-left:20px;">${tradeoffsHtml}</ul>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Common examples</div>
      <ul style="margin:0;padding-left:20px;">${examplesHtml}</ul>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Implementation pointers</div>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#cfcfcf;">${escapeHtml(recommendation.implementationPointers)}</p>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Where the recommendations come from</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Tier eligibility.</span> HubSpot product KB (custom object availability article, updated April 28, 2026): Custom Objects require Enterprise on any hub. HubDB requires Content Hub Professional or higher. Behavioral and custom events require Marketing Hub Enterprise or Data Hub Enterprise.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Structural tests.</span> Many-to-many relationships that custom properties cannot support is the test from Hyphadev&#39;s Custom Objects walkthrough. The facility_1_address, facility_2_address red-flag pattern is from Set2Close&#39;s lead-data structure guide. HubDB as reference/lookup, custom events as immutable and multi-occurrence, are both from ProfitPad&#39;s HubSpot data primitives breakdown.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Examples.</span> RevBlack&#39;s HubSpot custom object case studies (Licenses, Shipments, Partners, Projects).</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Pro-tier workaround.</span> Repurposing standard objects (Companies, Deals, Tickets) is the consensus pattern across HubSpot Community threads from 2025 and 2026. HubSpot has not added Custom Objects to Pro despite repeated requests.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;"><span style="color:#eaeaea;font-weight:500;">Dunamis model assumptions.</span> Frequently changing = updated more than once per quarter on average. Multiple instances = expecting 3+ instances per parent record on average. Both are heuristics that surface the structural decision; calibrate against your actual usage data once it is in HubSpot.</p>
    </div>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:18px;">Re-run the tree if your tier or relationship structure changes.</p>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Questions? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#a89bff;">josh@dunamisstudios.net</a>.<br><br>
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[decision-tree-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[decision-tree-email] send failed", error);
    throw new Error("Failed to send custom object decision tree email");
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
