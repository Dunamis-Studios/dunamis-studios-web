/**
 * List every EULA acceptance record for a single Atelier license,
 * newest-first. Slim license projection ships alongside the
 * acceptances so the EULA history modal in /admin/licenses can
 * render the license context (email, status, issued_at) without a
 * separate fetch.
 */
import { NextResponse } from "next/server";

import {
  requireAdmin,
  isAdminAllowlistConfigured,
  ADMIN_ALLOWLIST_UNCONFIGURED_BODY,
} from "@/lib/session";
import { getLicense } from "@/lib/atelier-license-signing";
import { listEulaAcceptancesForLicense } from "@/lib/atelier-eula";

/**
 * GET /api/admin/eula-acceptances/{lid}
 *
 * List every EULA acceptance record for a single Atelier license,
 * newest-first. Powers the "EULA history" modal in /admin/licenses.
 *
 * Returns a slim projection of the license alongside the records so
 * the modal can render the license context (email, status, issued_at)
 * without a separate fetch.
 *
 *   200 { license: {...}, acceptances: [{...}] }
 *   404 { error: "License not found." }
 *   503 in dev when ADMIN_EMAILS isn't configured
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ lid: string }> },
) {
  if (!isAdminAllowlistConfigured()) {
    return NextResponse.json(ADMIN_ALLOWLIST_UNCONFIGURED_BODY, { status: 503 });
  }

  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const { lid } = await context.params;
  if (!lid || lid.length > 64) {
    return NextResponse.json({ error: "Invalid lid." }, { status: 400 });
  }

  const license = await getLicense(lid);
  if (!license) {
    return NextResponse.json({ error: "License not found." }, { status: 404 });
  }

  const acceptances = await listEulaAcceptancesForLicense(lid);

  return NextResponse.json({
    license: {
      lid: license.lid,
      email: license.email,
      account_id: license.account_id ?? null,
      status: license.status,
      issued_at: license.issued_at,
      version_major: license.version_major,
    },
    acceptances,
  });
}
