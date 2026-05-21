/**
 * Customer-facing read of a single accepted-EULA artifact. Drives
 * the "Download my accepted EULA" button on /account/atelier-licenses.
 * Ownership check uses account_id match with an email-fallback for
 * unbacked migration-window records (account_id:null but email
 * matches). See the listLicensesForAccountWithFallback helper for the
 * matching fallback semantics on the index paths.
 */
import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/session";
import { getLicense } from "@/lib/atelier-license-signing";
import {
  listEulaAcceptancesForLicense,
  type AtelierEulaAcceptanceRecord,
} from "@/lib/atelier-eula";

/**
 * GET /api/atelier/eula-acceptance/{lid}/{version}
 *
 * Customer-facing read of one EULA acceptance record. Used by the
 * "Download my accepted EULA" button on /account/atelier-licenses to
 * fetch the verbatim rendered text the customer agreed to.
 *
 * Auth: signed-in account session. Ownership check: the license
 * must be bound to the caller's accountId (with email-fallback for
 * unbacked migration-window records — see
 * listLicensesForAccountWithFallback).
 *
 * Response:
 *   200 { acceptance: AtelierEulaAcceptanceRecord }
 *   401 unauthorized
 *   403 not_owned
 *   404 not_found
 */

export async function GET(
  _request: Request,
  context: { params: Promise<{ lid: string; version: string }> },
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const { lid, version } = await context.params;
  if (!lid || lid.length > 64 || !version || version.length > 40) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const license = await getLicense(lid);
  if (!license) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }
  // Ownership: account_id match, with email-fallback for unbacked
  // records (a record with account_id:null is considered owned by
  // the email-matching caller; the listLicensesForAccountWithFallback
  // helper applies the same rule on the list-licenses paths).
  const owns =
    license.account_id === session.account.accountId ||
    (license.account_id == null &&
      license.email.toLowerCase() === session.account.email.toLowerCase());
  if (!owns) {
    return NextResponse.json(
      { ok: false, error: "not_owned" },
      { status: 403 },
    );
  }

  const acceptances = await listEulaAcceptancesForLicense(lid);
  const acceptance: AtelierEulaAcceptanceRecord | undefined = acceptances.find(
    (a) => a.eula_version === version,
  );
  if (!acceptance) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, acceptance });
}
