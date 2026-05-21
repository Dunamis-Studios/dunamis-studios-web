/**
 * Sign + persist an Atelier license without sending email. Sibling
 * surface to /api/admin/issue-license; the difference is purely
 * whether the recipient gets the auto-delivery email. Used when an
 * admin wants the license string for an out-of-band channel.
 */
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

/**
 * POST /api/admin/sign-license
 *
 * Sign + persist an Atelier license. Does NOT email the customer —
 * that's /api/admin/issue-license. Useful when an admin needs the
 * license string for an out-of-band delivery channel (a copy/paste
 * into a support reply, for example).
 *
 * Auth: ADMIN_EMAILS allowlist via requireAdmin().
 */

const bodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .email("Enter a valid email address"),
  /**
   * Dunamis account id binding. Optional during the migration window
   * for parity with /api/admin/issue-license. Net-new admin issuance
   * via the picker UI sends both fields together.
   */
  account_id: z.string().trim().min(1).max(128).optional(),
  product: z.literal("atelier"),
  version_major: z.number().int().min(1).max(99),
  tier: z.enum(VALID_TIERS),
});

export async function POST(request: Request) {
  // Fast 503 in dev where ADMIN_EMAILS is intentionally unset.
  // Distinct from a 403 you'd get in prod for a non-admin user.
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

  try {
    const { signed, record } = await signAndPersistLicense({
      email: parsed.data.email,
      accountId: parsed.data.account_id ?? null,
      product: parsed.data.product,
      versionMajor: parsed.data.version_major,
      tier: parsed.data.tier,
      issuedByAdminEmail: admin.account.email,
    });
    return NextResponse.json({ license: signed.licenseString, lid: signed.lid, record });
  } catch (err) {
    if (err instanceof LicenseSigningUnavailableError) {
      return NextResponse.json(LICENSE_SIGNING_UNAVAILABLE_BODY, { status: 503 });
    }
    console.error("[admin/sign-license] failed", err);
    return NextResponse.json(
      { error: "License signing failed. Check server logs." },
      { status: 500 },
    );
  }
}
