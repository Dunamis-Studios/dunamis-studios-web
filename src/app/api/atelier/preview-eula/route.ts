/**
 * Render the personalized Atelier EULA for the in-app acceptance
 * screen. Returns the rendered text plus its sha256 so the desktop
 * can show, hash-pin, and later submit the acceptance. The matching
 * record-eula-acceptance route re-derives the same render from the
 * same inputs and verifies the hash; see POST docstring for the
 * determinism contract that lets the preview and accept calls agree.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";

import { getLicense, parseLicenseId } from "@/lib/atelier-license-signing";
import { getActivation } from "@/lib/atelier-activation";
import { getAccountById } from "@/lib/accounts";
import { CURRENT_ATELIER_EULA_VERSION } from "@/lib/atelier-eula";
import {
  formatAcceptanceDate,
  loadAtelierEulaTemplate,
  renderEulaForCustomer,
  type EulaSubstitutions,
} from "@/lib/eula-renderer";

/**
 * POST /api/atelier/preview-eula
 *
 * Render the personalized Atelier EULA the customer is about to be
 * shown on the in-app EULA acceptance screen. Returns:
 *   - rendered_eula_text — the verbatim text the screen will display
 *   - rendered_eula_sha256 — SHA-256 of that text
 *   - acceptance_date — pre-formatted "Month D, YYYY" string the
 *     server stamped in the rendered text
 *   - eula_version — the template version this preview is against
 *   - substitution_values — the exact substitution map used (echoed
 *     back so the desktop can include it on the accept call to
 *     guarantee byte equality)
 *
 * Auth: same defense-in-depth as /api/atelier/heartbeat —
 * license_string + activation_id pair, byte-for-byte equal to the
 * canonical Redis records.
 *
 * Determinism contract: this endpoint and /api/atelier/record-eula-
 * acceptance MUST produce byte-identical rendered_eula_text for the
 * same (license_string, activation_id, atelier_version,
 * acceptance_date) tuple. The Atelier client passes acceptance_date
 * back into the accept call so a midnight-boundary preview-then-
 * accept flow doesn't drift.
 */

const bodySchema = z.object({
  license_string: z.string().min(1).max(4096),
  activation_id: z.string().uuid(),
  atelier_version: z.string().min(1).max(40),
});

type AcceptancePreview = {
  ok: true;
  eula_version: string;
  acceptance_date: string;
  rendered_eula_text: string;
  rendered_eula_sha256: string;
  substitution_values: EulaSubstitutions;
};

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
  const acceptance_date = formatAcceptanceDate(new Date());

  // Compose the device fingerprint string for the Parties block.
  // The activation record stores the three component sha256 hashes;
  // we surface them as one canonical string so the customer can see
  // the full fingerprint, not a truncated form. Concatenated with
  // dashes for readability — the audit can split on `-` to recover
  // the components.
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
    ACCEPTANCE_DATE: acceptance_date,
    DEVICE_FINGERPRINT: device_fingerprint,
    ATELIER_VERSION: body.atelier_version,
  };

  let rendered_eula_text: string;
  try {
    rendered_eula_text = renderEulaForCustomer(substitutions);
  } catch (err) {
    console.error("[preview-eula] render failed", err);
    return NextResponse.json(
      { ok: false, error: "render_failed" },
      { status: 500 },
    );
  }
  const rendered_eula_sha256 = createHash("sha256")
    .update(rendered_eula_text, "utf8")
    .digest("hex");

  // Note: we deliberately do NOT serialize substitution_values into
  // the request body the desktop sends back on accept. The accept
  // path re-derives them from the same inputs (license + activation
  // + acceptance_date) and recomputes the rendered text, then
  // verifies the recomputed sha256 matches what the desktop reports
  // it saw. That double-pin prevents a malicious client from
  // accepting a doctored substitution map.
  const response: AcceptancePreview = {
    ok: true,
    eula_version: CURRENT_ATELIER_EULA_VERSION,
    acceptance_date,
    rendered_eula_text,
    rendered_eula_sha256,
    substitution_values: substitutions,
  };
  return NextResponse.json(response);
}
