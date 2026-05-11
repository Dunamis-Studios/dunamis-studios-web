import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";

import { getLicense, parseLicenseId } from "@/lib/atelier-license-signing";
import { getActivation } from "@/lib/atelier-activation";
import { getAccountById } from "@/lib/accounts";
import {
  CURRENT_ATELIER_EULA_VERSION,
  recordEulaAcceptance,
} from "@/lib/atelier-eula";
import {
  loadAtelierEulaTemplate,
  renderEulaForCustomer,
  type EulaSubstitutions,
} from "@/lib/eula-renderer";
import { rateLimit } from "@/lib/ratelimit";
import { truncatedClientIp } from "@/lib/truncate-ip";

/**
 * POST /api/atelier/record-eula-acceptance
 *
 * Persist the customer's acceptance of the personalized Atelier EULA.
 * The Atelier desktop calls this immediately after the customer
 * clicks Accept on the in-app EULA screen; the call carries the same
 * inputs that produced the preview so the server can re-render the
 * EXACT bytes the customer just saw and store them as the legal
 * artifact.
 *
 * Determinism contract: the server re-renders using the same
 * (license, activation, atelier_version, acceptance_date) tuple that
 * /api/atelier/preview-eula used. The desktop passes the exact
 * acceptance_date string from the preview response in the accept
 * call to guarantee byte equality across midnight boundaries. The
 * desktop also passes the rendered_eula_sha256 it saw; the server
 * cross-checks the recomputed sha256 matches and refuses the accept
 * if they diverge (defense against a desktop posting a doctored
 * substitution map).
 *
 * Idempotent on (lid, eula_version) at the persistence layer — see
 * recordEulaAcceptance(). A retry from the desktop after a
 * partially-failed accept returns the original record verbatim.
 *
 * Request body:
 *   {
 *     license_string: string,
 *     activation_id: uuid,
 *     atelier_version: string,
 *     eula_version: string,
 *     acceptance_date: string,           // echoed from preview
 *     expected_sha256: string,           // echoed from preview
 *   }
 *
 * Response: 200 { ok: true, record: {...} }
 *           400 invalid_request / sha256_mismatch
 *           404 license_not_found / activation_not_found
 *           409 license_unbound / account_missing / eula_version_mismatch
 *           410 license_refunded / license_revoked / activation_deactivated
 *           500 render_failed
 */

const bodySchema = z.object({
  license_string: z.string().min(1).max(4096),
  activation_id: z.string().uuid(),
  atelier_version: z.string().min(1).max(40),
  eula_version: z.string().min(1).max(40),
  /** The acceptance_date string from the preview response. The
   *  server pinned this format ("Month D, YYYY" en-US); the desktop
   *  must echo it verbatim. */
  acceptance_date: z.string().min(1).max(64),
  /** SHA-256 of the rendered EULA the desktop displayed to the
   *  customer. Server recomputes its own and compares. */
  expected_sha256: z.string().regex(/^[0-9a-f]{64}$/i, "must be sha256 hex"),
});

export async function POST(request: Request) {
  const rl = await rateLimit(request, "eula");
  if (!rl.ok) return rl.response;

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
    return NextResponse.json(
      { ok: false, error: "license_unbound" },
      { status: 409 },
    );
  }
  const account = await getAccountById(license.account_id);
  if (!account) {
    return NextResponse.json(
      { ok: false, error: "account_missing" },
      { status: 409 },
    );
  }

  const template = loadAtelierEulaTemplate();

  const device_fingerprint = [
    activation.machine_id.windows_guid,
    activation.machine_id.motherboard_serial,
    activation.machine_id.cpu_id,
  ].join("-");

  const substitutions: EulaSubstitutions = {
    PRODUCT_NAME: template.metadata.productName,
    PRODUCT_VERSION: template.metadata.productVersion,
    EFFECTIVE_DATE: template.metadata.effectiveDate,
    LICENSOR: template.metadata.licensor,
    LICENSEE_FULL_NAME: `${account.firstName} ${account.lastName}`.trim(),
    LICENSEE_EMAIL: account.email,
    LICENSEE_COMPANY:
      account.companyName && account.companyName.trim().length > 0
        ? account.companyName
        : "Not specified",
    LICENSE_ID: lid,
    ACCEPTANCE_DATE: body.acceptance_date,
    DEVICE_FINGERPRINT: device_fingerprint,
    ATELIER_VERSION: body.atelier_version,
  };

  let rendered_eula_text: string;
  try {
    rendered_eula_text = renderEulaForCustomer(substitutions);
  } catch (err) {
    console.error("[record-eula-acceptance] render failed", err);
    return NextResponse.json(
      { ok: false, error: "render_failed" },
      { status: 500 },
    );
  }
  const rendered_eula_sha256 = createHash("sha256")
    .update(rendered_eula_text, "utf8")
    .digest("hex");

  // Cross-check: the desktop must have shown the same bytes the
  // server is about to record. If the sha256 diverges, refuse —
  // either the desktop is on a stale template version, the
  // acceptance_date got mangled in transit, or someone tampered
  // with the client. Either way, the legal artifact would be
  // wrong; better to fail loudly and force a fresh preview.
  if (rendered_eula_sha256 !== body.expected_sha256.toLowerCase()) {
    return NextResponse.json(
      {
        ok: false,
        error: "sha256_mismatch",
        expected: body.expected_sha256.toLowerCase(),
        recomputed: rendered_eula_sha256,
      },
      { status: 400 },
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
    ip_at_accept: truncatedClientIp(request),
    user_agent_at_accept: request.headers.get("user-agent"),
    rendered_eula_text,
    substitution_values: substitutions,
    rendered_eula_sha256,
    device_fingerprint,
  });

  return NextResponse.json({ ok: true, record });
}
