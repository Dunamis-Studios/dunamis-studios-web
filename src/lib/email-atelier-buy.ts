import { Resend } from "resend";

/**
 * Atelier buy-request transactional emails.
 *
 * Two messages fire when the /api/atelier-buy-request endpoint accepts
 * a submission, both best-effort and isolated from each other so a
 * Resend hiccup on one does not fail the lead capture or block the
 * other email:
 *
 *   1. sendAtelierBuyRequestAdminEmail — notifies Josh that a new
 *      buy-request landed, with all the details so the follow-up can
 *      start within the studio's commitment window.
 *   2. sendAtelierBuyRequestCustomerConfirmation — confirms to the
 *      buyer that their request was received and sets expectations
 *      for the next step.
 *
 * Resend is the same provider that backs every other transactional
 * email on the site (verify, reset, welcome, notify-on-launch). The
 * client construction mirrors src/lib/email.ts but stays local to
 * this file so the buy-request flow's email shape can evolve
 * independently.
 *
 * Atelier is a single-tier $149 product, so there is no tier field on
 * the payload. Customization is a post-purchase service engagement,
 * not a pre-pay tier — never reference tier copy in either email.
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
  const subject = `Atelier buy-request — ${payload.firstName} ${payload.lastName}${
    payload.businessName ? ` (${payload.businessName})` : ""
  }`;

  const text = [
    `New Atelier buy-request:`,
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
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Atelier buy-request</div>
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
  const subject = `We received your Atelier request, ${payload.firstName}`;

  const text = `Hi ${payload.firstName},

Thanks for your Atelier request. We'll reach out from josh@dunamisstudios.net within one business day with payment instructions and your perpetual license. Once payment lands, you'll receive the installer, the license key, and the setup guide. You'll be running Atelier within the hour.

Atelier is $149, paid once. Bug fixes are free for as long as we operate the major version you bought — there's no time limit. If you ever need help with setup, customization, or a feature scope down the line, that's a separate conversation we're happy to have once you've used the software.

If anything changed since you submitted the form — wrong email, second thoughts — just reply to this email. There's no payment yet; you're not committed to anything.

— Josh
Dunamis Studios`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;color:#eaeaea;">Hi ${escape(payload.firstName)},</p>
    <p style="font-size:15px;line-height:1.6;color:#eaeaea;">Thanks for your Atelier request. We&apos;ll reach out from <a href="mailto:josh@dunamisstudios.net" style="color:#d97a7d;">josh@dunamisstudios.net</a> within one business day with payment instructions and your perpetual license. Once payment lands, you&apos;ll receive the installer, the license key, and the setup guide. You&apos;ll be running Atelier within the hour.</p>
    <p style="font-size:15px;line-height:1.6;color:#eaeaea;">Atelier is $149, paid once. Bug fixes are free for as long as we operate the major version you bought — there&apos;s no time limit. If you ever need help with setup, customization, or a feature scope down the line, that&apos;s a separate conversation we&apos;re happy to have once you&apos;ve used the software.</p>
    <p style="font-size:14px;line-height:1.6;color:#aaa;margin-top:18px;">If anything changed since you submitted the form — wrong email, second thoughts — just reply to this email. There&apos;s no payment yet; you&apos;re not committed to anything.</p>
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
