import { Resend } from "resend";

/**
 * Atelier interest / notify-on-launch transactional emails.
 *
 * Atelier is in active development. The form on the marketing page
 * captures launch-notification interest, NOT purchases — neither email
 * here mentions payment, invoicing, or shipping the installer "now."
 * Customer copy promises a single email at launch.
 *
 * Two messages fire when the /api/atelier-buy-request endpoint accepts
 * a submission, both best-effort and isolated from each other so a
 * Resend hiccup on one does not fail the lead capture or block the
 * other email:
 *
 *   1. sendAtelierBuyRequestAdminEmail — notifies Josh that a new
 *      interest signup landed, with all the details so the launch
 *      notification list can be built up.
 *   2. sendAtelierBuyRequestCustomerConfirmation — confirms to the
 *      visitor that their interest was recorded and sets expectations
 *      (one email at launch, no newsletter).
 *
 * Resend is the same provider that backs every other transactional
 * email on the site (verify, reset, welcome, notify-on-launch). The
 * client construction mirrors src/lib/email.ts but stays local to
 * this file so the flow's email shape can evolve independently.
 *
 * Atelier is a single-tier $149 product (at launch), so there is no
 * tier field on the payload. Customization is a post-purchase service
 * engagement, not a pre-pay tier — never reference tier copy in
 * either email.
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

function adminAddress(): string {
  // Falls back to the public address if no admin override is set so
  // production never silently swallows the lead-capture notification.
  return (
    process.env.ATELIER_ADMIN_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    "hello@dunamisstudios.net"
  );
}

function redact(addr: string): string {
  const at = addr.indexOf("@");
  if (at < 1) return "[redacted]";
  const local = addr.slice(0, at);
  const domain = addr.slice(at);
  const head = local.length > 1 ? local[0] : "";
  return `${head}***${domain}`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface BuyRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  businessName?: string;
  notes?: string;
  ip?: string;
  userAgent?: string;
}

export async function sendAtelierBuyRequestAdminEmail(
  payload: BuyRequestPayload,
): Promise<void> {
  const businessLine = payload.businessName ?? "(not provided)";
  const subject = `Atelier interest — ${payload.firstName} ${payload.lastName}${
    payload.businessName ? ` (${payload.businessName})` : ""
  }`;

  const text = [
    `New Atelier interest signup:`,
    ``,
    `Name:     ${payload.firstName} ${payload.lastName}`,
    `Email:    ${payload.email}`,
    `Business: ${businessLine}`,
    payload.notes ? `Notes:\n${payload.notes}` : `Notes:    (none)`,
    ``,
    `IP:       ${payload.ip ?? "unknown"}`,
    `Agent:    ${payload.userAgent ?? "unknown"}`,
  ].join("\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Atelier interest signup</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#888;width:90px;">Name</td><td style="padding:6px 0;color:#eaeaea;">${escape(payload.firstName)} ${escape(payload.lastName)}</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;color:#eaeaea;"><a href="mailto:${escape(payload.email)}" style="color:#d97a7d;">${escape(payload.email)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#888;">Business</td><td style="padding:6px 0;color:#eaeaea;">${escape(businessLine)}</td></tr>
    </table>
    ${
      payload.notes
        ? `<div style="margin-top:20px;padding:14px 16px;border:1px solid #262626;border-radius:10px;background:#0c0c0c;">
            <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:8px;">Notes</div>
            <div style="font-size:14px;color:#eaeaea;white-space:pre-wrap;line-height:1.55;">${escape(payload.notes)}</div>
          </div>`
        : ""
    }
    <div style="margin-top:24px;padding-top:18px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      IP: ${escape(payload.ip ?? "unknown")}<br>
      Agent: ${escape(payload.userAgent ?? "unknown")}
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[atelier-buy] RESEND_API_KEY missing — would notify admin about ${redact(payload.email)}`,
    );
    return;
  }

  const { error } = await client().emails.send({
    from: `Atelier buy-requests <${fromAddress()}>`,
    to: adminAddress(),
    replyTo: payload.email,
    subject,
    html,
    text,
  });
  if (error) {
    console.error("[atelier-buy] admin email failed", error);
    throw new Error("Atelier admin email send failed");
  }
}

export async function sendAtelierBuyRequestCustomerConfirmation(
  payload: BuyRequestPayload,
): Promise<void> {
  const subject = `You're on the Atelier launch list, ${payload.firstName}`;

  const text = `Hi ${payload.firstName},

Thanks for signing up for Atelier launch notifications. You're on the list — when the installer is ready, you'll get a single email from josh@dunamisstudios.net with the download link, payment instructions, and your perpetual license.

A few things worth knowing while you wait:

  - At launch, Atelier is a one-time $149 purchase. No subscription, no renewal, no per-seat fees.
  - Bug fixes are free for as long as we operate the major version you bought — no time limit.
  - Atelier is local-first: it runs on your Windows PC, your data stays on your machine, and it never phones home.

If your situation changes between now and launch — different email, different studio, second thoughts — just reply to this email. We don't share or sell this list, and you'll only hear from us at launch and when there's a substantial product update.

— Josh
Dunamis Studios`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;color:#eaeaea;">Hi ${escape(payload.firstName)},</p>
    <p style="font-size:15px;line-height:1.6;color:#eaeaea;">Thanks for signing up for Atelier launch notifications. You&apos;re on the list — when the installer is ready, you&apos;ll get a single email from <a href="mailto:josh@dunamisstudios.net" style="color:#d97a7d;">josh@dunamisstudios.net</a> with the download link, payment instructions, and your perpetual license.</p>
    <p style="font-size:15px;line-height:1.6;color:#eaeaea;">A few things worth knowing while you wait:</p>
    <ul style="font-size:14px;line-height:1.7;color:#cfcfcf;padding-left:18px;">
      <li>At launch, Atelier is a one-time $149 purchase. No subscription, no renewal, no per-seat fees.</li>
      <li>Bug fixes are free for as long as we operate the major version you bought — no time limit.</li>
      <li>Atelier is local-first: it runs on your Windows PC, your data stays on your machine, and it never phones home.</li>
    </ul>
    <p style="font-size:14px;line-height:1.6;color:#aaa;margin-top:18px;">If your situation changes between now and launch — different email, different studio, second thoughts — just reply to this email. We don&apos;t share or sell this list, and you&apos;ll only hear from us at launch and when there&apos;s a substantial product update.</p>
    <p style="font-size:14px;line-height:1.6;color:#aaa;">— Josh<br>Dunamis Studios</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Dunamis Studios — a software studio with a HubSpot specialty.<br>
      Questions? <a href="mailto:josh@dunamisstudios.net" style="color:#d97a7d;">josh@dunamisstudios.net</a>
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[atelier-buy] RESEND_API_KEY missing — would confirm to ${redact(payload.email)}`,
    );
    return;
  }

  const { error } = await client().emails.send({
    from: `Dunamis Studios <${fromAddress()}>`,
    to: payload.email,
    subject,
    html,
    text,
  });
  if (error) {
    console.error("[atelier-buy] customer confirmation email failed", error);
    throw new Error("Atelier customer confirmation email send failed");
  }
}
