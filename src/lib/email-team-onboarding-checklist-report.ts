import { Resend } from "resend";
import {
  ROLE_LABELS,
  type OnboardingAnswers,
  type OnboardingResults,
  type PhaseScore,
  type Tier,
} from "./team-onboarding-checklist-logic";

/**
 * Transactional email for /tools/hubspot-team-onboarding-checklist.
 * Same dark-card template family as the other /tools emails. No
 * product CTA. Body restates the rep role, the readiness score, the
 * tier verdict, the phase-by-phase breakdown, the top three priority
 * actions, and any role-specific risk flags.
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
  answers: OnboardingAnswers;
  results: OnboardingResults;
}

export async function sendTeamOnboardingChecklistEmail({
  to,
  answers,
  results,
}: SendArgs): Promise<void> {
  const roleLabel = ROLE_LABELS[answers.role];
  const subject = `Onboarding readiness: ${results.totalScore}/100, tier ${results.tier} (${roleLabel})`;

  const text = [
    "Here is the team onboarding checklist you generated on dunamisstudios.net.",
    "",
    `Role: ${roleLabel}`,
    `Onboarding readiness score: ${results.totalScore} / 100`,
    `Tier: ${results.tier}`,
    `Verdict: ${results.tierBlurb}`,
    "",
    "Phase-by-phase breakdown:",
    ...results.phases.map(
      (p) =>
        `  ${p.label}: ${Math.round(p.points)} / ${Math.round(p.maxPoints)} pts (${p.fullCreditCount}/${p.applicableCount} complete${p.naCount > 0 ? `, ${p.naCount} N/A` : ""})`,
    ),
    "",
    "Top 3 prioritized actions:",
    ...results.topActions.flatMap((a, i) => [
      `  ${i + 1}. ${a.title}`,
      `     ${a.body}`,
    ]),
    "",
    ...(results.riskFlags.length > 0
      ? [
          "Role-specific risk flags:",
          ...results.riskFlags.flatMap((f) => [
            `  - ${f.title}`,
            `    ${f.body}`,
          ]),
          "",
        ]
      : []),
    "Where the benchmarks come from:",
    "Lifecycle Stage customizability since March 2022, auto-progression rules per portal, and property-level permissions under Settings > Users & Teams > Permissions are documented in HubSpot's Knowledge Base.",
    "Buying Roles as association labels per deal (not contact properties) is the HubSpot Community consensus pattern.",
    "Sequences as the highest-leverage sales tool, and daily active use, activities logged, and deals worked as the three core adoption metrics, are from Hublead's HubSpot adoption guidance.",
    "Pipeline rules to require properties before stage advancement is from LeadCRM's deal stage configuration guide.",
    "Lead Status as the post-touchpoint operational field versus Lifecycle Stage as the broad journey field is from Default.com's HubSpot field definitions.",
    "The OnTheFuze 2026 reference for 'Other' lifecycle stage exceeding 5% of the database as a structural-problem signal applies to property-creation governance for RevOps admins.",
    "The HubSpot Community pattern of adding 'Disqualified' or 'Nurture' lifecycle stages to keep the CRM clean informs the SDR disqualification taxonomy guidance.",
    "",
    "Dunamis model assumptions:",
    "Score weights: Access & Permissions 15%, Core Concepts 20%, Role-Specific Property Knowledge 20%, Tool Enablement 15%, Process Discipline 15%, Integrations 5%, Reporting & Goals 5%, Adoption Check 5%. Tiers: Ready (80-100), Mostly Ready (50-79), Gaps (20-49), Critical Gaps (0-19). N/A answers are excluded from each phase's denominator so the phase weight stays whole. Critical Gaps means the rep is at high risk of corrupting data or defaulting to spreadsheets.",
    "",
    "Re-run the assessment at week 1, week 2, and day 30 to track ramp.",
    "",
    "Questions? Reply to this email or write to josh@dunamisstudios.net.",
    "",
    "Dunamis Studios",
  ].join("\n");

  const tierColor = tierColorFor(results.tier);

  const phaseRows = results.phases
    .map(
      (p) => `<tr>
  <td style="padding:5px 0;color:#cfcfcf;font-size:14px;">${escapeHtml(p.label)}</td>
  <td style="padding:5px 0;font-family:Menlo,Consolas,monospace;text-align:right;color:${phaseColor(p)};">${Math.round(p.points)} / ${Math.round(p.maxPoints)} pts</td>
  <td style="padding:5px 0;font-family:Menlo,Consolas,monospace;text-align:right;color:#888;font-size:12px;">${p.fullCreditCount}/${p.applicableCount}${p.naCount > 0 ? ` (${p.naCount} N/A)` : ""}</td>
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

  const riskFlagsHtml =
    results.riskFlags.length === 0
      ? ""
      : `
    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #4a2a2a;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#e0726a;margin-bottom:10px;">Role-specific risk flags</div>
      ${results.riskFlags
        .map(
          (f, i) => `<div style="${i > 0 ? "margin-top:14px;padding-top:14px;border-top:1px solid #2a1a1a;" : ""}">
        <div style="font-size:14px;color:#e0a060;font-weight:500;">${escapeHtml(f.title)}</div>
        <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:6px 0 0;">${escapeHtml(f.body)}</p>
      </div>`,
        )
        .join("")}
    </div>`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:640px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Here is the team onboarding checklist you generated on dunamisstudios.net.</p>

    <div style="margin-top:24px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Onboarding readiness score</div>
      <div style="display:flex;align-items:baseline;gap:12px;">
        <div style="font-family:Georgia,serif;font-size:48px;font-weight:500;letter-spacing:-0.02em;color:${tierColor};">${results.totalScore}</div>
        <div style="font-size:13px;color:#888;">/ 100</div>
        <div style="margin-left:auto;font-size:13px;color:${tierColor};font-weight:500;">${escapeHtml(results.tier)}</div>
      </div>
      <div style="margin-top:8px;font-size:13px;color:#888;">Role: <span style="color:#cfcfcf;">${escapeHtml(roleLabel)}</span></div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:10px 0 0;">${escapeHtml(results.tierBlurb)}</p>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Phase-by-phase breakdown</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">${phaseRows}</table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Top 3 prioritized actions</div>
      ${actionsHtml}
    </div>

    ${riskFlagsHtml}

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Where the benchmarks come from</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">HubSpot KB.</span> Lifecycle Stage customizability since March 2022, auto-progression rules per portal, and property-level permissions under Settings &gt; Users &amp; Teams &gt; Permissions.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Hublead.</span> Sequences as the highest-leverage sales tool. Daily active use, activities logged, and deals worked as the three core adoption metrics.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">LeadCRM.</span> Pipeline rules require properties before stage advancement.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">Default.com.</span> Lead Status updates after every touchpoint; Lifecycle Stage tracks the broader journey.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">HubSpot Community.</span> Buying Roles as association labels per deal (not contact properties). Adding a &quot;Disqualified&quot; or &quot;Nurture&quot; lifecycle stage as a common pattern to keep the CRM clean.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;"><span style="color:#eaeaea;font-weight:500;">OnTheFuze 2026.</span> &quot;Other&quot; lifecycle stage at &gt;5% of the database signals a structural problem; the same drift pattern surfaces in property creation without governance.</p>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;"><span style="color:#eaeaea;font-weight:500;">Dunamis model assumptions.</span> Score weights: Access 15%, Concepts 20%, Role-Specific 20%, Tools 15%, Process 15%, Integrations 5%, Reporting 5%, Adoption 5%. Tiers: Ready (80-100), Mostly Ready (50-79), Gaps (20-49), Critical Gaps (0-19). N/A answers are excluded from each phase&#39;s denominator so phase weight stays whole.</p>
    </div>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:18px;">Re-run the assessment at week 1, week 2, and day 30 to track ramp.</p>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Questions? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#a89bff;">josh@dunamisstudios.net</a>.<br><br>
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[team-onboarding-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[team-onboarding-email] send failed", error);
    throw new Error("Failed to send team onboarding checklist email");
  }
}

function tierColorFor(tier: Tier): string {
  switch (tier) {
    case "Ready":
      return "#7ec77a";
    case "Mostly Ready":
      return "#cfcfcf";
    case "Gaps":
      return "#e0a060";
    case "Critical Gaps":
      return "#e0726a";
  }
}

function phaseColor(p: PhaseScore): string {
  if (p.applicableCount === 0) return "#888";
  if (p.fraction >= 0.9) return "#7ec77a";
  if (p.fraction >= 0.5) return "#cfcfcf";
  if (p.fraction >= 0.2) return "#e0a060";
  return "#e0726a";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
