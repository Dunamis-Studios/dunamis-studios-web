import { Resend } from "resend";

/**
 * Transactional email for "Email me this report" submissions on the
 * /tools surfaces. Keeps a separate template family from email-notify
 * (product launch alerts) and email.ts (account-flow templates) so the
 * tool-report copy can evolve without coupling to those flows.
 *
 * Degrades gracefully when RESEND_API_KEY is unset: callers persist the
 * Redis row before invoking this helper, so the lead capture survives
 * even when the email send is skipped in local dev.
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

function fmtUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtHours(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} hrs`;
}

export interface HandoffCalculatorInputs {
  reps: number;
  dealsPerRepPerQuarter: number;
  handoffHours: number;
  hourlyCost: number;
  turnoverPct: number;
}

export interface HandoffCalculatorResults {
  annualDeals: number;
  routineHours: number;
  routineCost: number;
  turnoverHandoffs: number;
  turnoverHours: number;
  turnoverCost: number;
  totalHours: number;
  totalCost: number;
}

interface SendArgs {
  to: string;
  inputs: HandoffCalculatorInputs;
  results: HandoffCalculatorResults;
}

export async function sendHandoffCalculatorReportEmail({
  to,
  inputs,
  results,
}: SendArgs): Promise<void> {
  const subject = `Your handoff time report: ${fmtUsd(results.totalCost)} per year`;

  const text = [
    "Here is the handoff cost breakdown you generated on dunamisstudios.net.",
    "",
    "Your inputs:",
    `  Sales reps: ${inputs.reps}`,
    `  Deals per rep per quarter: ${inputs.dealsPerRepPerQuarter}`,
    `  Hours per handoff: ${inputs.handoffHours}`,
    `  Rep hourly cost: ${fmtUsd(inputs.hourlyCost)}`,
    `  Annual rep turnover: ${inputs.turnoverPct}%`,
    "",
    "Results:",
    `  Annual deals across the team: ${results.annualDeals.toLocaleString("en-US")}`,
    `  Hours spent on routine handoffs per year: ${fmtHours(results.routineHours)}`,
    `  Dollar cost of routine handoff time: ${fmtUsd(results.routineCost)}`,
    `  Hours lost to in-process owner changes (turnover): ${fmtHours(results.turnoverHours)} across ${results.turnoverHandoffs} reassigned books`,
    `  Total annual handoff cost: ${fmtUsd(results.totalCost)}`,
    "",
    "Industry sourcing:",
    "B2B SaaS sales rep turnover averages 30 to 36 percent annually (Bridge Group, Xactly, Ebsta).",
    "Sales reps spend about 28 percent of their time actively selling, with the rest on admin and ramp work (Salesforce State of Sales 2024).",
    "Account research alone runs 1 to 3 hours per account on the receiving end (Salesmotion).",
    "",
    "Our model assumptions:",
    "Two hours per handoff is our working estimate for synthesized handoff time, not a published benchmark.",
    "The 2x penalty on cold reassignments is our assumption based on the new owner starting from zero context, not published data.",
    "",
    "How we calculated this:",
    "  annual_deals     = reps * deals_per_rep_per_quarter * 4",
    "  routine_hours    = annual_deals * hours_per_handoff",
    "  routine_cost     = routine_hours * rep_hourly_cost",
    "  reassigned_books = round(reps * turnover_pct * deals_per_rep_per_quarter)",
    "  cold_hours       = reassigned_books * hours_per_handoff * 2",
    "  cold_cost        = cold_hours * rep_hourly_cost",
    "  total_cost       = routine_cost + cold_cost",
    "",
    "These are directional estimates based on industry research. Your actual numbers will vary. Adjust the inputs to match your portal and the output recalculates.",
    "",
    "Debrief automates this. It generates an inheritance brief on every CRM record when ownership changes, so the new owner gets a 90-second read instead of an hour of timeline scrolling. Free during marketplace beta.",
    "",
    "https://www.dunamisstudios.net/products/debrief",
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
    <p style="font-size:15px;line-height:1.6;">Here is the handoff cost breakdown you generated on dunamisstudios.net.</p>

    <div style="margin-top:24px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Your inputs</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#888;">Sales reps</td><td style="text-align:right;">${inputs.reps}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Deals per rep per quarter</td><td style="text-align:right;">${inputs.dealsPerRepPerQuarter}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Hours per handoff</td><td style="text-align:right;">${inputs.handoffHours}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Rep hourly cost</td><td style="text-align:right;">${fmtUsd(inputs.hourlyCost)}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Annual rep turnover</td><td style="text-align:right;">${inputs.turnoverPct}%</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Results</div>
      <table style="width:100%;font-size:14px;color:#cfcfcf;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#888;">Annual deals across the team</td><td style="text-align:right;">${results.annualDeals.toLocaleString("en-US")}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Hours on routine handoffs / year</td><td style="text-align:right;">${fmtHours(results.routineHours)}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Cost of routine handoff time</td><td style="text-align:right;">${fmtUsd(results.routineCost)}</td></tr>
        <tr><td style="padding:4px 0;color:#888;">Hours lost to owner-change reassignments</td><td style="text-align:right;">${fmtHours(results.turnoverHours)}</td></tr>
        <tr><td style="padding:8px 0 4px;color:#eaeaea;font-weight:500;border-top:1px solid #262626;">Total annual handoff cost</td><td style="text-align:right;padding-top:8px;border-top:1px solid #262626;font-weight:500;color:#eaeaea;">${fmtUsd(results.totalCost)}</td></tr>
      </table>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">Industry sourcing</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0 0 10px;">B2B SaaS sales rep turnover averages 30 to 36 percent annually (Bridge Group, Xactly, Ebsta). Sales reps spend about 28 percent of their time actively selling, with the rest on admin and ramp work (Salesforce State of Sales 2024). Account research alone runs 1 to 3 hours per account on the receiving end (Salesmotion).</p>
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin:14px 0 10px;">Our model assumptions</div>
      <p style="font-size:13px;line-height:1.6;color:#cfcfcf;margin:0;">Two hours per handoff is our working estimate for synthesized handoff time, not a published benchmark. The 2x penalty on cold reassignments is our assumption based on the new owner starting from zero context, not published data.</p>
    </div>

    <div style="margin-top:18px;padding:18px;background:#0e0e0e;border:1px solid #262626;border-radius:10px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#888;margin-bottom:10px;">How we calculated this</div>
      <pre style="margin:0;font-family:Menlo,Consolas,monospace;font-size:12px;line-height:1.7;color:#cfcfcf;white-space:pre-wrap;">annual_deals     = reps * deals_per_rep_per_quarter * 4
routine_hours    = annual_deals * hours_per_handoff
routine_cost     = routine_hours * rep_hourly_cost
reassigned_books = round(reps * turnover_pct * deals_per_rep_per_quarter)
cold_hours       = reassigned_books * hours_per_handoff * 2
cold_cost        = cold_hours * rep_hourly_cost
total_cost       = routine_cost + cold_cost</pre>
    </div>

    <p style="font-size:12px;line-height:1.6;color:#888;margin-top:18px;">These are directional estimates based on industry research. Your actual numbers will vary. Adjust the inputs to match your portal and the output recalculates live.</p>

    <div style="margin-top:24px;padding:18px;background:#1a1530;border:1px solid #3b2f7a;border-radius:10px;">
      <div style="font-size:13px;line-height:1.6;color:#cfcfcf;">Debrief automates this. It generates an inheritance brief on every CRM record when ownership changes, so the new owner gets a 90-second read instead of an hour of timeline scrolling. Free during marketplace beta.</div>
      <p style="margin:14px 0 0;"><a href="https://www.dunamisstudios.net/products/debrief" style="display:inline-block;background:#6d5cf5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">See Debrief</a></p>
    </div>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Questions? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#a89bff;">josh@dunamisstudios.net</a>.<br><br>
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[tool-report-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[tool-report-email] send failed", error);
    throw new Error("Failed to send tool report email");
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
