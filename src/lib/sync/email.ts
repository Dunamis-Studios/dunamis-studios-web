import { Resend } from "resend";

/**
 * Sync transactional email templates. Sent by the daily trial-expiry
 * cron at T-3 days and T-0 days, and by the grace-cleanup cron when a
 * customer's blobs are deleted at end-of-grace.
 *
 * Degrades gracefully when RESEND_API_KEY is unset (matches the pattern
 * in src/lib/email-atelier-license.ts and friends): the function logs
 * a one-line redacted intent and returns without throwing, so the
 * cron job stays green in any environment that doesn't have email
 * provisioned.
 */

function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function sender(): string {
  return (
    process.env.RESEND_FROM_EMAIL ?? "Dunamis Studios <hello@dunamisstudios.net>"
  );
}

export async function sendTrialT3Email(
  to: string,
  trialEndsAt: string,
): Promise<void> {
  const c = client();
  if (!c) {
    console.error(
      `[sync-email] RESEND_API_KEY missing — would send T-3 trial reminder to ${redactEmail(to)} (ends ${trialEndsAt})`,
    );
    return;
  }
  await c.emails.send({
    from: sender(),
    to,
    subject: "Your Dunamis Sync trial ends in 3 days",
    text: trialT3Body(trialEndsAt),
    html: wrapHtml(trialT3Body(trialEndsAt)),
  });
}

export async function sendTrialT0Email(to: string): Promise<void> {
  const c = client();
  if (!c) {
    console.error(
      `[sync-email] RESEND_API_KEY missing — would send T-0 trial expiry to ${redactEmail(to)}`,
    );
    return;
  }
  await c.emails.send({
    from: sender(),
    to,
    subject: "Your Dunamis Sync trial has ended",
    text: trialT0Body(),
    html: wrapHtml(trialT0Body()),
  });
}

export async function sendGraceExpiredEmail(
  to: string,
  graceEndedAt: string,
): Promise<void> {
  const c = client();
  if (!c) {
    console.error(
      `[sync-email] RESEND_API_KEY missing — would send grace-expired to ${redactEmail(to)} (grace ended ${graceEndedAt})`,
    );
    return;
  }
  await c.emails.send({
    from: sender(),
    to,
    subject: "Your Dunamis Sync data has been deleted",
    text: graceExpiredBody(graceEndedAt),
    html: wrapHtml(graceExpiredBody(graceEndedAt)),
  });
}

function trialT3Body(trialEndsAt: string): string {
  return [
    "Your Dunamis Sync trial month ends in 3 days.",
    "",
    `End date: ${trialEndsAt}`,
    "",
    "If you'd like to keep cross-device access, subscribe before the trial ends and your synced data carries forward without interruption.",
    "",
    "Subscribe: https://dunamisstudios.net/products/dunamis-sync",
    "",
    "If you don't subscribe, your synced data enters a 30-day grace period at trial end. If you subscribe within those 30 days, sync resumes from where it left off. After grace, all data is permanently deleted.",
    "",
    "— Dunamis Studios",
  ].join("\n");
}

function trialT0Body(): string {
  return [
    "Your Dunamis Sync trial month has ended.",
    "",
    "Your synced data is now in a 30-day grace period. If you subscribe within 30 days, sync resumes from where it left off. After 30 days, all data is permanently deleted.",
    "",
    "Subscribe: https://dunamisstudios.net/products/dunamis-sync",
    "",
    "Atelier itself is unaffected — it continues to work locally exactly as before.",
    "",
    "— Dunamis Studios",
  ].join("\n");
}

function graceExpiredBody(graceEndedAt: string): string {
  return [
    "Your Dunamis Sync grace period has ended and your synced data has been permanently deleted.",
    "",
    `Grace ended: ${graceEndedAt}`,
    "",
    "Atelier on your desktop is unaffected and continues to work locally. If you'd like to start fresh with cross-device sync, subscribe again at https://dunamisstudios.net/products/dunamis-sync — you'll need to re-pair your phone or tablet from inside Atelier.",
    "",
    "— Dunamis Studios",
  ].join("\n");
}

function wrapHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.55;max-width:560px;color:#1c1b1a;white-space:pre-wrap">${escaped}</div>`;
}
