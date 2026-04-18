import { Resend } from "resend";

/**
 * Thin abstraction over the transactional email provider. Swap Resend for
 * Postmark/SendGrid by replacing just the `send` implementation — the call
 * sites stay the same.
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let resend: Resend | null = null;
function client() {
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

async function send({ to, subject, html, text }: SendArgs): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Degrade gracefully in local dev without a real key — log and move on.
    console.warn(
      `[email] RESEND_API_KEY missing. Would send to ${to}:\n  ${subject}\n${text}`,
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
    console.error("[email] send failed", error);
    throw new Error("Failed to send email");
  }
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:520px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    ${body}
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Dunamis Studios — precision tools for HubSpot.<br>
      Questions? <a href="mailto:josh@dunamisstudios.net" style="color:#6d5cf5;">josh@dunamisstudios.net</a>
    </div>
  </div>
</body></html>`;
}

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  token: string,
): Promise<void> {
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/verify-email/${token}`;
  const subject = "Verify your Dunamis Studios account";
  const text = `Hi ${firstName},\n\nConfirm your email to finish setting up Dunamis Studios:\n${url}\n\nThis link expires in 24 hours.\n\nQuestions? josh@dunamisstudios.net`;
  const html = layout(
    subject,
    `<p style="font-size:15px;line-height:1.6;">Hi ${firstName},</p>
     <p style="font-size:15px;line-height:1.6;">Confirm your email to finish setting up your Dunamis Studios account.</p>
     <p style="margin:24px 0;"><a href="${url}" style="display:inline-block;background:#6d5cf5;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:500;">Verify email</a></p>
     <p style="font-size:13px;color:#888;">Or paste this link into your browser:<br><span style="font-family:Menlo,monospace;font-size:12px;color:#aaa;word-break:break-all;">${url}</span></p>
     <p style="font-size:13px;color:#888;">This link expires in 24 hours.</p>`,
  );
  await send({ to, subject, html, text });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  token: string,
): Promise<void> {
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/reset-password/${token}`;
  const subject = "Reset your Dunamis Studios password";
  const text = `Hi ${firstName},\n\nWe received a request to reset your password. If this was you, use this link (expires in 1 hour):\n${url}\n\nIf not, you can safely ignore this email.\n\nQuestions? josh@dunamisstudios.net`;
  const html = layout(
    subject,
    `<p style="font-size:15px;line-height:1.6;">Hi ${firstName},</p>
     <p style="font-size:15px;line-height:1.6;">We received a request to reset your password. If this was you, click below. Otherwise, you can safely ignore this email.</p>
     <p style="margin:24px 0;"><a href="${url}" style="display:inline-block;background:#6d5cf5;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:500;">Reset password</a></p>
     <p style="font-size:13px;color:#888;">Or paste this link into your browser:<br><span style="font-family:Menlo,monospace;font-size:12px;color:#aaa;word-break:break-all;">${url}</span></p>
     <p style="font-size:13px;color:#888;">This link expires in 1 hour.</p>`,
  );
  await send({ to, subject, html, text });
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
): Promise<void> {
  const subject = "Welcome to Dunamis Studios";
  const text = `Hi ${firstName},\n\nThanks for creating an account. When you install Property Pulse or Debrief from the HubSpot marketplace, your entitlements will appear automatically in your dashboard.\n\nNeed anything? Email josh@dunamisstudios.net and I'll get back to you personally.\n\n— Dunamis Studios`;
  const html = layout(
    subject,
    `<p style="font-size:15px;line-height:1.6;">Hi ${firstName},</p>
     <p style="font-size:15px;line-height:1.6;">Thanks for creating an account. When you install Property Pulse or Debrief from the HubSpot marketplace, your entitlements will appear automatically in your dashboard.</p>
     <p style="font-size:15px;line-height:1.6;">Need anything? Email <a href="mailto:josh@dunamisstudios.net" style="color:#6d5cf5;">josh@dunamisstudios.net</a> and I&apos;ll get back to you personally.</p>
     <p style="font-size:15px;line-height:1.6;color:#aaa;">— Dunamis Studios</p>`,
  );
  await send({ to, subject, html, text });
}
