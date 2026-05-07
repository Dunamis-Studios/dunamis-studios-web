import { NextResponse } from "next/server";
import { z } from "zod";

import { listLicensesByEmail } from "@/lib/atelier-license-signing";
import { sendAtelierLicenseEmail } from "@/lib/email-atelier-license";

/**
 * POST /api/atelier/lookup-license
 *
 * Customer self-service license lookup. Public endpoint, no auth.
 *
 * Anti-enumeration: always returns 200 with the same body shape
 * regardless of whether the email matches anything in the issuance
 * database. A scraper running this endpoint against a wordlist of
 * emails cannot tell which addresses are customers and which aren't.
 *
 * On a match: sends every active license tied to the email back to
 * the email on file via Resend. The same isResend:true template the
 * admin resend route uses.
 *
 * Bot mitigation: honeypot field. A real browser user never sees the
 * `website` field (it's display:none in the form), so a non-empty
 * value indicates a bot fill-in and the request is silently treated
 * as a match-of-nothing. Cloudflare Turnstile is the future-correct
 * answer; the honeypot is the v1 fallback.
 */

const bodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .email(),
  // Honeypot. Real users never see this field. If a value lands
  // here, the submission is from a bot and we silently no-op.
  website: z.string().max(200).optional(),
});

const SUCCESS_BODY = {
  ok: true,
  message:
    "If we found a license for that email, we sent it. Check your inbox.",
};

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    // Even on bad JSON, mirror the success response. The endpoint's
    // contract is "always 200, always identical body" — variation in
    // status codes is itself an enumeration signal.
    return NextResponse.json(SUCCESS_BODY);
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(SUCCESS_BODY);
  }

  // Honeypot check. Silent no-op for bot submissions.
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json(SUCCESS_BODY);
  }

  try {
    const all = await listLicensesByEmail(parsed.data.email);
    const active = all.filter((l) => l.status === "active");
    if (active.length === 0) {
      return NextResponse.json(SUCCESS_BODY);
    }
    // Send each active license as a separate email so the customer's
    // inbox preserves the per-license context. With v1's
    // single-license-per-customer norm this is almost always one
    // email; the loop is forward-compatible with multi-license
    // customers later.
    for (const license of active) {
      try {
        await sendAtelierLicenseEmail({
          to: license.email,
          licenseString: license.key_string,
          isResend: true,
        });
      } catch (err) {
        // Per-email failure is logged but doesn't fail the request —
        // partial deliveries are better than zero deliveries when
        // multiple licenses are involved.
        console.error("[atelier/lookup-license] email failed", err);
      }
    }
  } catch (err) {
    // Redis or other infrastructure failures are logged. We still
    // return the success body to preserve the anti-enumeration
    // contract — an attacker who can trigger Redis errors should not
    // be able to differentiate a customer from a non-customer.
    console.error("[atelier/lookup-license] lookup failed", err);
  }

  return NextResponse.json(SUCCESS_BODY);
}
