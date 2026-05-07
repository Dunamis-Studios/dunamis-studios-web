import { NextResponse } from "next/server";
import { z } from "zod";

import {
  requireAdmin,
  isAdminAllowlistConfigured,
  ADMIN_ALLOWLIST_UNCONFIGURED_BODY,
} from "@/lib/session";
import { getLicense } from "@/lib/atelier-license-signing";
import { sendAtelierLicenseEmail } from "@/lib/email-atelier-license";

/**
 * POST /api/admin/resend-license-email
 *
 * Re-send an existing license to the customer's email on file.
 * Useful when a customer reports they lost their key — the
 * authoritative record in Redis is the same key they already received,
 * so we just re-send it. We do NOT re-sign; the cryptographic
 * signature is the original one.
 */

const bodySchema = z.object({
  lid: z.string().trim().min(1).max(64),
});

export async function POST(request: Request) {
  // Fast 503 in dev where ADMIN_EMAILS is intentionally unset.
  if (!isAdminAllowlistConfigured()) {
    return NextResponse.json(ADMIN_ALLOWLIST_UNCONFIGURED_BODY, { status: 503 });
  }

  try {
    await requireAdmin();
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
    return NextResponse.json({ error: "Invalid lid." }, { status: 400 });
  }

  const license = await getLicense(parsed.data.lid);
  if (!license) {
    return NextResponse.json({ error: "License not found." }, { status: 404 });
  }

  try {
    await sendAtelierLicenseEmail({
      to: license.email,
      licenseString: license.key_string,
      isResend: true,
    });
  } catch (err) {
    console.error("[admin/resend-license-email] failed", err);
    return NextResponse.json(
      { error: "Email send failed. Check Resend dashboard." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, email: license.email });
}
