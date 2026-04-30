import { Resend } from "resend";

/**
 * Confirmation email sent when a visitor signs up to be notified about
 * an unshipped product (e.g., Carbon Copy, Traverse and Update). Kept
 * separate from src/lib/email.ts so the notify path can evolve without
 * coupling to the account-flow templates.
 *
 * Degrades gracefully when RESEND_API_KEY is unset: the signup is still
 * persisted to Redis by the caller; the confirmation email is skipped
 * with a redacted log line. This matches the behavior of the existing
 * email helpers so local dev does not require a real Resend key.
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

interface NotifySignupArgs {
  to: string;
  productName: string;
}

export async function sendNotifySignupEmail({
  to,
  productName,
}: NotifySignupArgs): Promise<void> {
  const subject = `You're on the list for ${productName}`;
  const text = `Thanks for signing up to hear about ${productName}.\n\nWe'll send one email when it ships. No newsletter, no drip campaign, no sharing your email with anyone.\n\nQuestions in the meantime? Reply to this email or write to josh@dunamisstudios.net.\n\nDunamis Studios`;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:520px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Thanks for signing up to hear about <strong>${productName}</strong>.</p>
    <p style="font-size:15px;line-height:1.6;">We'll send one email when it ships. No newsletter, no drip campaign, no sharing your email with anyone.</p>
    <p style="font-size:15px;line-height:1.6;">Questions in the meantime? Reply to this email or write to <a href="mailto:josh@dunamisstudios.net" style="color:#6d5cf5;">josh@dunamisstudios.net</a>.</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Dunamis Studios. Precision tools for HubSpot.
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[notify-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[notify-email] send failed", error);
    throw new Error("Failed to send notify confirmation email");
  }
}
