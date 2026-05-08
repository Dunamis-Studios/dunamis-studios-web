import { Resend } from "resend";

/**
 * Atelier license-delivery email.
 *
 * Sent when an Atelier license is issued (either via the admin UI or
 * the CLI tool) and re-sent when a customer asks for a copy of their
 * key. The license string is the load-bearing payload; everything
 * around it is context to make sure the customer (a) knows what to
 * do with it, (b) saves a copy, and (c) knows where to find help.
 *
 * Tone: warm-but-direct. The customer just paid for software (or
 * about to pay, depending on issuance flow). The email should feel
 * like a real human delivering a real product, not a transactional
 * receipt.
 *
 * Plain-text + HTML both delivered. The license string appears
 * verbatim in the plain-text body so customers using terminals,
 * accessibility tools, or copy-from-source workflows can grab it
 * without parsing HTML.
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

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function redactEmail(addr: string): string {
  const at = addr.indexOf("@");
  if (at < 1) return "[redacted]";
  const local = addr.slice(0, at);
  const domain = addr.slice(at);
  const head = local.length > 1 ? local[0] : "";
  return `${head}***${domain}`;
}

export interface AtelierLicenseEmailInput {
  to: string;
  firstName?: string | null;
  licenseString: string;
  /** Whether this is the first delivery (after purchase) or a resend
   *  prompted by a "I lost my key" support request. The email subject
   *  and intro paragraph adjust slightly. */
  isResend?: boolean;
}

export async function sendAtelierLicenseEmail(
  input: AtelierLicenseEmailInput,
): Promise<void> {
  const greeting = input.firstName ? `Hi ${input.firstName},` : "Hi there,";
  const subject = input.isResend
    ? "Your Atelier license key (resent)"
    : "Your Atelier license key";
  const intro = input.isResend
    ? "Here's your Atelier license key, sent again at your request."
    : "Welcome to Atelier. Here's your license key.";

  const installUrl = "https://dunamisstudios.net/build-services/products/atelier/docs/install";
  const portalUrl = "https://dunamisstudios.net/account/atelier-licenses";
  const supportEmail = "legal@dunamisstudios.com";

  const text = `${greeting}

${intro}

License key:

${input.licenseString}

What to do with this:

  1. Save this email. The key is the only proof of your purchase, and we issue from a database — re-issuance is possible but slower than digging up your inbox.
  2. Install Atelier — instructions at ${installUrl}.
  3. On first launch, paste the key into the License Entry screen — or click "Choose license file…" on that screen and select the attached .atlr-license file. First activation needs internet (a quick license check); after that Atelier works offline for up to 30 days between license check-ins.

Activation, in plain terms:

  - One license activates on up to 3 devices at a time.
  - Manage your devices at ${portalUrl} or from inside Atelier at Settings → License — both surfaces let you free a slot for a new machine.
  - Wedding data never leaves your machine. License activation is the only thing that phones home.

Atelier is yours. The license is perpetual, the bug fixes are free for as long as we operate the major version you bought, and the data lives on your machine.

Questions or trouble? Reply to this email or write to ${supportEmail}.

— Josh
Dunamis Studios`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(subject)}</title></head>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0a;margin:0;padding:32px 16px;color:#eaeaea;">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:14px;padding:32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:500;letter-spacing:-0.02em;margin-bottom:24px;">Dunamis Studios</div>
    <p style="font-size:15px;line-height:1.6;color:#eaeaea;">${escape(greeting)}</p>
    <p style="font-size:15px;line-height:1.6;color:#eaeaea;">${escape(intro)}</p>

    <div style="margin:24px 0;padding:16px 18px;border:1px solid #2a1a1c;border-radius:10px;background:#0c0606;">
      <div style="font-size:11px;color:#8a8a8a;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:10px;">License key</div>
      <code style="font-family:Menlo,Consolas,monospace;font-size:13px;color:#eaeaea;word-break:break-all;line-height:1.5;display:block;">${escape(input.licenseString)}</code>
    </div>

    <p style="font-size:14px;line-height:1.6;color:#cfcfcf;font-weight:500;">Save this email.</p>
    <p style="font-size:14px;line-height:1.6;color:#cfcfcf;">The key is the only proof of your purchase. We can re-issue it if you lose it, but it's faster if you keep this email.</p>

    <p style="font-size:14px;line-height:1.6;color:#cfcfcf;margin-top:18px;">Next steps:</p>
    <ol style="font-size:14px;line-height:1.7;color:#cfcfcf;padding-left:18px;">
      <li>Install Atelier — <a href="${installUrl}" style="color:#d97a7d;">setup walkthrough</a>.</li>
      <li>On the License Entry screen, paste the key above — or click <strong>Choose license file…</strong> and select the attached <code style="font-family:Menlo,Consolas,monospace;font-size:12px;">.atlr-license</code> file.</li>
      <li>First activation needs internet for a quick license check. After that Atelier works offline for up to 30 days between check-ins.</li>
    </ol>

    <p style="font-size:14px;line-height:1.6;color:#cfcfcf;margin-top:18px;">Activation, in plain terms:</p>
    <ul style="font-size:14px;line-height:1.7;color:#cfcfcf;padding-left:18px;">
      <li>One license activates on up to 3 devices at a time.</li>
      <li>Manage your devices at <a href="${portalUrl}" style="color:#d97a7d;">your customer portal</a> or from inside Atelier at <strong>Settings → License</strong>.</li>
      <li>Wedding data never leaves your machine. License activation is the only thing that phones home.</li>
    </ul>

    <p style="font-size:14px;line-height:1.6;color:#aaa;margin-top:18px;">Atelier is yours. The license is perpetual, bug fixes are free for as long as we operate the major version you bought, and the data lives on your machine.</p>
    <p style="font-size:14px;line-height:1.6;color:#aaa;">Questions or trouble? Reply to this email or write to <a href="mailto:${supportEmail}" style="color:#d97a7d;">${supportEmail}</a>.</p>
    <p style="font-size:14px;line-height:1.6;color:#aaa;">— Josh<br>Dunamis Studios</p>

    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #262626;color:#888;font-size:12px;line-height:1.6;">
      Dunamis Studios — a software studio with a HubSpot specialty.<br>
      Documentation: <a href="https://dunamisstudios.net/build-services/products/atelier/docs" style="color:#d97a7d;">dunamisstudios.net/build-services/products/atelier/docs</a>
    </div>
  </div>
</body></html>`;

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[atelier-license] RESEND_API_KEY missing — would deliver license to ${redactEmail(input.to)}`,
    );
    return;
  }

  // Attach the license string as a .atlr-license file so customers
  // can drive Atelier's "Choose license file…" picker on the License
  // Entry screen instead of copy-pasting the long ATLR-… string out
  // of the email body. Resend expects content as a base64 string for
  // raw attachments. The trailing newline gives the file a clean
  // "one line + EOL" shape when opened in any text editor; Atelier's
  // file reader trims it on the way in.
  const licenseFile = `${input.licenseString}\n`;
  const licenseFileBase64 = Buffer.from(licenseFile, "utf8").toString("base64");

  const { error } = await client().emails.send({
    from: `Dunamis Studios <${fromAddress()}>`,
    to: input.to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: "atelier.atlr-license",
        content: licenseFileBase64,
      },
    ],
  });
  if (error) {
    console.error("[atelier-license] license-delivery email failed", error);
    throw new Error("Atelier license email send failed");
  }
}
