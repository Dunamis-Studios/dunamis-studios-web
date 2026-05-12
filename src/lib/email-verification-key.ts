import { Resend } from "resend";

/**
 * Transactional email for the Mode B verification-key flow. Sent
 * from /api/support/verification-key/email to whoever the visitor
 * typed into the email field on the support form's verification
 * widget. The key arrives as the body's centerpiece so the
 * recipient can copy/paste it back into the form without leaving
 * their inbox.
 *
 * Degrades gracefully when RESEND_API_KEY is unset: logs the
 * redacted recipient + the subject and returns successfully. The
 * Mode B endpoint always returns the same 200 to the client
 * regardless of whether the email actually went out, so a missing
 * key in local dev / preview just means the customer never
 * receives anything (but no enumeration signal leaks).
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
  key: string;
}

export async function sendVerificationKeyEmail({
  to,
  key,
}: SendArgs): Promise<void> {
  const subject = "Your verification key for Dunamis Studios support";
  const text = [
    "Hi,",
    "",
    "You requested a verification key to submit a support request on dunamisstudios.net.",
    "",
    "Your key is:",
    "",
    key,
    "",
    "Copy this key and paste it into the verification field on the support form to complete your submission.",
    "",
    "This key is valid for 30 minutes from now.",
    "",
    "If you didn't request this, you can safely ignore this email.",
    "",
    "Dunamis Studios",
    "https://www.dunamisstudios.net",
  ].join("\n");
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:520px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;">Hi,</p>
    <p style="font-size:15px;line-height:1.6;">You requested a verification key to submit a support request on dunamisstudios.net.</p>
    <p style="font-size:13px;color:#888;line-height:1.6;">Your key is:</p>
    <p style="margin:8px 0 16px;"><span style="display:inline-block;font-family:Menlo,monospace;font-size:15px;letter-spacing:0.04em;background:#1f1f1f;border:1px solid #303030;border-radius:8px;padding:10px 14px;color:#eaeaea;word-break:break-all;">${key}</span></p>
    <p style="font-size:15px;line-height:1.6;">Copy this key and paste it into the verification field on the support form to complete your submission.</p>
    <p style="font-size:13px;color:#888;line-height:1.6;">This key is valid for 30 minutes from now.</p>
    <p style="font-size:13px;color:#888;line-height:1.6;">If you didn&apos;t request this, you can safely ignore this email.</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Dunamis Studios. Precision tools for HubSpot.<br>
      Questions? <a href="mailto:josh@dunamisstudios.net" style="color:#6d5cf5;">josh@dunamisstudios.net</a>
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn( // claude-code:allow-console
      `[verification-key-email] RESEND_API_KEY missing. Would send "${subject}" to ${redactEmail(to)}`,
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
    console.error("[verification-key-email] send failed", error);
    throw new Error("Failed to send verification key email");
  }
}
