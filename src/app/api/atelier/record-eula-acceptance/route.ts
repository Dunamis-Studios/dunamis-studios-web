import { NextResponse } from "next/server";
import { z } from "zod";

import { getLicense, parseLicenseId } from "@/lib/atelier-license-signing";
import { getActivation } from "@/lib/atelier-activation";
import { getAccountById } from "@/lib/accounts";
import {
  CURRENT_ATELIER_EULA_VERSION,
  recordEulaAcceptance,
} from "@/lib/atelier-eula";

/**
 * POST /api/atelier/record-eula-acceptance
 *
 * Persist the customer's acceptance of the Atelier EULA. The desktop
 * calls this immediately after the user clicks the EULA-accept
 * checkbox; on transient failure (no internet, server 5xx) the
 * desktop queues the call into the local pending_eula_sync table and
 * retries on next launch.
 *
 * Authentication is "license_string + activation_id pair, byte-for-
 * byte equal to the canonical Redis records." Same threat model as
 * /api/atelier/heartbeat — defense-in-depth on top of the Rust
 * client's local Ed25519 verification.
 *
 * Request body:
 *   {
 *     license_string: string,
 *     activation_id: uuid,
 *     atelier_version: string,
 *     eula_version: string,
 *   }
 *
 * Response:
 *   200 { ok: true, record: {...} } on success
 *   200 { ok: true, record: {...}, idempotent: true } when re-posting
 *     an already-recorded (lid, eula_version) pair
 *   400 invalid_request / invalid_json
 *   404 license_not_found / activation_not_found
 *   409 license_unbound — license has no account_id, can't bind an
 *     acceptance record (caller should run the backfill or have an
 *     admin reissue)
 *   410 license_refunded / license_revoked / activation_deactivated
 */

const bodySchema = z.object({
  license_string: z.string().min(1).max(4096),
  activation_id: z.string().uuid(),
  atelier_version: z.string().min(1).max(40),
  /**
   * Echoed back in the response. The Atelier desktop sends the
   * version string from its bundled EULA-TEMPLATE.md frontmatter; we
   * cross-check against the server-side current version to refuse
   * acceptance of a version the server doesn't recognize (rotated /
   * retired) — that prevents a stale Atelier build from claiming
   * acceptance of a version the legal team has already deprecated.
   */
  eula_version: z.string().min(1).max(40),
});

function ipFromRequest(request: Request): string | null {
  // Vercel exposes x-forwarded-for; the leftmost entry is the
  // originating client. Fall back to x-real-ip.
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const body = parsed.data;

  if (body.eula_version !== CURRENT_ATELIER_EULA_VERSION) {
    return NextResponse.json(
      {
        ok: false,
        error: "eula_version_mismatch",
        expected: CURRENT_ATELIER_EULA_VERSION,
        sent: body.eula_version,
      },
      { status: 409 },
    );
  }

  const lid = parseLicenseId(body.license_string);
  if (!lid) {
    return NextResponse.json(
      { ok: false, error: "license_not_found" },
      { status: 404 },
    );
  }
  const license = await getLicense(lid);
  if (!license || license.key_string !== body.license_string) {
    return NextResponse.json(
      { ok: false, error: "license_not_found" },
      { status: 404 },
    );
  }

  if (license.status === "refunded") {
    return NextResponse.json(
      { ok: false, error: "license_refunded" },
      { status: 410 },
    );
  }
  if (license.status === "revoked") {
    return NextResponse.json(
      { ok: false, error: "license_revoked" },
      { status: 410 },
    );
  }

  const activation = await getActivation(body.activation_id);
  if (!activation || activation.lid !== lid) {
    return NextResponse.json(
      { ok: false, error: "activation_not_found" },
      { status: 404 },
    );
  }
  if (activation.status === "deactivated") {
    return NextResponse.json(
      { ok: false, error: "activation_deactivated" },
      { status: 410 },
    );
  }

  if (!license.account_id) {
    // Edge: a license predates the account_id field and the backfill
    // hasn't run. Refuse rather than write an orphan acceptance —
    // the admin's job is to run the backfill (or reissue) before the
    // customer's EULA flow can complete. The desktop renders a
    // structured error pointing the user at support.
    return NextResponse.json(
      { ok: false, error: "license_unbound" },
      { status: 409 },
    );
  }

  const account = await getAccountById(license.account_id);
  if (!account) {
    // Account was hard-deleted (very rare — soft delete is the
    // default). Treat as unbound; the customer needs an admin to
    // restore or reissue.
    return NextResponse.json(
      { ok: false, error: "account_missing" },
      { status: 409 },
    );
  }

  const record = await recordEulaAcceptance({
    lid,
    account_id: account.accountId,
    eula_version: body.eula_version,
    atelier_version: body.atelier_version,
    email_at_accept: account.email,
    first_name_at_accept: account.firstName,
    last_name_at_accept: account.lastName,
    company_name_at_accept: account.companyName ?? null,
    ip_at_accept: ipFromRequest(request),
    user_agent_at_accept: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true, record });
}
