import { NextResponse } from "next/server";
import { z } from "zod";

import {
  requireAdmin,
  isAdminAllowlistConfigured,
  ADMIN_ALLOWLIST_UNCONFIGURED_BODY,
} from "@/lib/session";
import {
  signAndPersistLicense,
  VALID_TIERS,
  LicenseSigningUnavailableError,
  LICENSE_SIGNING_UNAVAILABLE_BODY,
} from "@/lib/atelier-license-signing";
import { sendAtelierLicenseEmail } from "@/lib/email-atelier-license";

/**
 * POST /api/admin/issue-license
 *
 * Sign + persist + email the customer. The end-to-end one-click
 * issuance path used by the admin UI for the common case.
 *
 * Failure isolation: if the signing or persistence fails, the whole
 * call returns 500 and nothing has been emailed. If the email step
 * fails, the license is still in Redis and the admin sees a partial-
 * success response — the email can be resent via the resend route.
 */

const bodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .email("Enter a valid email address"),
  product: z.literal("atelier"),
  version_major: z.number().int().min(1).max(99),
  tier: z.enum(VALID_TIERS),
  /** Optional first name for the email greeting. */
  first_name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  // Fast 503 in dev where ADMIN_EMAILS is intentionally unset.
  if (!isAdminAllowlistConfigured()) {
    return NextResponse.json(ADMIN_ALLOWLIST_UNCONFIGURED_BODY, { status: 503 });
  }

  let admin;
  try {
    admin = await requireAdmin();
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid input.", field: issue?.path?.[0] },
      { status: 400 },
    );
  }

  let signed;
  let record;
  try {
    const result = await signAndPersistLicense({
      email: parsed.data.email,
      product: parsed.data.product,
      versionMajor: parsed.data.version_major,
      tier: parsed.data.tier,
      issuedByAdminEmail: admin.account.email,
    });
    signed = result.signed;
    record = result.record;
  } catch (err) {
    if (err instanceof LicenseSigningUnavailableError) {
      return NextResponse.json(LICENSE_SIGNING_UNAVAILABLE_BODY, { status: 503 });
    }
    console.error("[admin/issue-license] sign+persist failed", err);
    return NextResponse.json(
      { error: "License signing failed. Check server logs." },
      { status: 500 },
    );
  }

  let emailSent = true;
  let emailError: string | null = null;
  try {
    await sendAtelierLicenseEmail({
      to: parsed.data.email,
      firstName: parsed.data.first_name ?? null,
      licenseString: signed.licenseString,
      isResend: false,
    });
  } catch (err) {
    console.error("[admin/issue-license] email failed", err);
    emailSent = false;
    emailError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    license: signed.licenseString,
    lid: signed.lid,
    record,
    email_sent: emailSent,
    email_error: emailError,
  });
}
