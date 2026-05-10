import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getLicense,
  listLicensesForAccountWithFallback,
  parseLicenseId,
} from "@/lib/atelier-license-signing";
import {
  MAX_ACTIVATIONS_PER_LICENSE,
  createActivation,
  getActivationsForLicense,
  matchesMachine,
  refreshActivationHeartbeat,
} from "@/lib/atelier-activation";
import { getSessionFromBearer } from "@/lib/session";
import { getAccountById } from "@/lib/accounts";
import { CURRENT_ATELIER_EULA_VERSION } from "@/lib/atelier-eula";

/**
 * POST /api/atelier/activate
 *
 * Called by the Atelier client during License Entry to bind a paid
 * license to a specific device. The 2-of-3 component matching rule in
 * matchesMachine() refreshes an existing slot when the same machine
 * re-activates after a hardware swap, so a customer who replaces a
 * motherboard or CPU does not consume a new slot.
 *
 * Authentication is "byte-for-byte equality of the license string
 * against the canonical key_string in Redis." The Rust client
 * already verifies the Ed25519 signature locally before calling this
 * endpoint, so the server-side check is defense-in-depth — a
 * tampered license_string fails the equality check and the request
 * cannot inherit any activation slot.
 *
 * Response shapes:
 *   200 ok:true with { activation_id, slot_count, max_slots,
 *                      first_activation } on success
 *   200 ok:false with { error: "slot_full", active_devices: [...] }
 *     when all 3 slots are taken by other machines (UI shows the
 *     inline "deactivate this one" picker)
 *   404 ok:false with { error: "license_not_found" } for unknown or
 *     tampered license strings
 *   410 ok:false with { error: "license_refunded" }
 *   410 ok:false with { error: "license_revoked", mode, revoked_at }
 */

const machineIdSchema = z.object({
  windows_guid: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "must be a sha256 hex digest"),
  motherboard_serial: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "must be a sha256 hex digest"),
  cpu_id: z.string().regex(/^[0-9a-f]{64}$/i, "must be a sha256 hex digest"),
});

// The endpoint accepts two body shapes that share the slot-allocation
// pipeline downstream:
//
//   1) license-string body (the original path, used by license-string
//      paste flows): { license_string, machine_id, device_label,
//      atelier_version }
//
//   2) account-bearer body (Phase 2.1): { lid, machine_id, device_label,
//      atelier_version } plus `Authorization: Bearer <jwt>`. Server
//      verifies the lid is owned by the bearer's account email.
//
// Both shapes converge on identical refunded/revoked/slot_full /
// hardware-fingerprint matching logic — there is no auth-path bypass
// of the 3-device cap. See dunamis-sync-v1-final-spec.md / the Phase
// 2.1 plan §3.4 for the explicit invariant.
const legacyBodySchema = z.object({
  license_string: z.string().min(1).max(4096),
  machine_id: machineIdSchema,
  device_label: z.string().trim().min(1).max(80),
  atelier_version: z.string().min(1).max(40),
});

const bearerBodySchema = z.object({
  lid: z.string().min(1).max(256),
  machine_id: machineIdSchema,
  device_label: z.string().trim().min(1).max(80),
  atelier_version: z.string().min(1).max(40),
});

/**
 * Slim public projection of an activation, for slot-full responses.
 * Hides the machine_id components (privacy: another machine on the
 * same license shouldn't be able to scrape another buyer's hardware
 * fingerprints) and surfaces only what the License Entry picker needs.
 */
function publicSlot(a: {
  activation_id: string;
  device_label: string;
  first_activated_at: string;
  last_heartbeat_at: string;
  atelier_version: string;
}) {
  return {
    activation_id: a.activation_id,
    device_label: a.device_label,
    first_activated_at: a.first_activated_at,
    last_heartbeat_at: a.last_heartbeat_at,
    atelier_version: a.atelier_version,
  };
}

/**
 * Build the customer_profile snapshot returned with every successful
 * activate response. Powers the EULA screen's "Accepting as:" block
 * without forcing the desktop to make a second authenticated round-
 * trip for the account record.
 *
 * Returns null when the license has no account_id (legacy /
 * unbacked record). The desktop renders the EULA screen in a
 * degraded "license unbound" state that points the customer at
 * support — the EULA still has to be accepted but the post-acceptance
 * server call surfaces a structured license_unbound error.
 */
async function customerProfileForLicense(
  accountId: string | null | undefined,
): Promise<{
  account_id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
} | null> {
  if (!accountId) return null;
  const account = await getAccountById(accountId);
  if (!account) return null;
  return {
    account_id: account.accountId,
    email: account.email,
    first_name: account.firstName,
    last_name: account.lastName,
    company_name: account.companyName ?? null,
  };
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

  // Discriminate by shape: a body carrying `license_string` is the
  // legacy path; a body carrying `lid` (and no license_string) is
  // the account-bearer path. We try the strict schemas in order rather
  // than a discriminated union so a malformed payload doesn't get
  // mapped to the wrong error.
  const isBearerShape =
    raw !== null &&
    typeof raw === "object" &&
    "lid" in (raw as Record<string, unknown>) &&
    !("license_string" in (raw as Record<string, unknown>));

  let lid: string;
  let body: z.infer<typeof legacyBodySchema> | z.infer<typeof bearerBodySchema>;
  let license: Awaited<ReturnType<typeof getLicense>>;

  if (isBearerShape) {
    const session = await getSessionFromBearer(request);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    const parsed = bearerBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_request", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    body = parsed.data;
    lid = body.lid;

    // Ownership check — the lid must be in the session-account's
    // license set, looked up by account_id (with email-index
    // fallback for unbacked migration-window records). 403 (not 404)
    // so we don't leak whether arbitrary lids exist on the platform.
    const owned = await listLicensesForAccountWithFallback(
      session.account.accountId,
      session.account.email,
    );
    const ownedLids = owned.map((l) => l.lid);
    if (!ownedLids.includes(lid)) {
      return NextResponse.json(
        { ok: false, error: "lid_not_owned" },
        { status: 403 },
      );
    }

    license = await getLicense(lid);
    if (!license) {
      // Lid was in the owner index but the canonical record was
      // missing — index drift, treat as not found.
      return NextResponse.json(
        { ok: false, error: "license_not_found" },
        { status: 404 },
      );
    }
  } else {
    const parsed = legacyBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "invalid_request", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    body = parsed.data;

    const parsedLid = parseLicenseId(body.license_string);
    if (!parsedLid) {
      return NextResponse.json(
        { ok: false, error: "license_not_found" },
        { status: 404 },
      );
    }
    lid = parsedLid;

    license = await getLicense(lid);
    if (!license) {
      return NextResponse.json(
        { ok: false, error: "license_not_found" },
        { status: 404 },
      );
    }

    // Byte-for-byte equality. A malformed payload that happens to embed
    // a real lid still fails here because the signature half (and thus
    // the full string) won't match what we issued.
    if (license.key_string !== body.license_string) {
      return NextResponse.json(
        { ok: false, error: "license_not_found" },
        { status: 404 },
      );
    }
  }

  if (license.status === "refunded") {
    return NextResponse.json(
      { ok: false, error: "license_refunded" },
      { status: 410 },
    );
  }
  if (license.status === "revoked") {
    return NextResponse.json(
      {
        ok: false,
        error: "license_revoked",
        mode: license.revocation_mode ?? "immediate",
        revoked_at: license.revoked_at ?? null,
      },
      { status: 410 },
    );
  }

  // Active license — proceed with slot allocation.
  const allActivations = await getActivationsForLicense(lid);
  const activeActivations = allActivations.filter(
    (a) => a.status === "active",
  );

  // Customer profile snapshot — same shape on both refresh and
  // first-activation paths. Resolved once per request and reused so
  // the two response branches stay byte-identical on the
  // customer-profile field.
  const customerProfile = await customerProfileForLicense(license.account_id);

  // 2-of-3 hardware match → refresh existing slot, no new slot consumed.
  const existing = activeActivations.find((a) =>
    matchesMachine(a.machine_id, body.machine_id),
  );
  if (existing) {
    const refreshed = await refreshActivationHeartbeat(
      existing,
      body.atelier_version,
    );
    return NextResponse.json({
      ok: true,
      activation_id: refreshed.activation_id,
      slot_count: activeActivations.length,
      max_slots: MAX_ACTIVATIONS_PER_LICENSE,
      first_activation: false,
      customer_profile: customerProfile,
      eula_version: CURRENT_ATELIER_EULA_VERSION,
    });
  }

  // No existing slot — check the cap before creating.
  if (activeActivations.length >= MAX_ACTIVATIONS_PER_LICENSE) {
    return NextResponse.json({
      ok: false,
      error: "slot_full",
      max_slots: MAX_ACTIVATIONS_PER_LICENSE,
      active_devices: activeActivations.map(publicSlot),
    });
  }

  const fresh = await createActivation({
    lid,
    machine_id: body.machine_id,
    device_label: body.device_label,
    atelier_version: body.atelier_version,
  });
  return NextResponse.json({
    ok: true,
    activation_id: fresh.activation_id,
    slot_count: activeActivations.length + 1,
    max_slots: MAX_ACTIVATIONS_PER_LICENSE,
    first_activation: allActivations.length === 0,
    customer_profile: customerProfile,
    eula_version: CURRENT_ATELIER_EULA_VERSION,
  });
}
