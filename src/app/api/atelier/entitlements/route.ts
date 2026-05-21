/**
 * Desktop-facing entitlements index. Differs from
 * /api/atelier/my-licenses in two ways: it accepts cookie OR Bearer
 * JWT auth (so the Atelier desktop can call it on launch), and it
 * INCLUDES key_string in the response so a freshly-signed-in
 * install can persist the license without an additional paste step.
 * See the GET docstring for the trust-boundary reasoning behind
 * exposing key_string here while the portal endpoint suppresses it.
 */
import { NextResponse } from "next/server";

import { getCurrentSessionAny } from "@/lib/session";
import {
  type AtelierLicenseRecord,
  listLicensesForAccountWithFallback,
} from "@/lib/atelier-license-signing";
import {
  type AtelierActivation,
  MAX_ACTIVATIONS_PER_LICENSE,
  getActivationsForLicense,
  matchesMachine,
} from "@/lib/atelier-activation";
import { toPublicAccount } from "@/lib/types";

/**
 * GET /api/atelier/entitlements
 *
 * Auth: cookie OR `Authorization: Bearer <jwt>` (Atelier desktop).
 * Returns the customer's account projection plus every Atelier license
 * tied to the account email, with each license's active activation
 * slots and a `is_current_device` flag the desktop UI uses to
 * recognize its own slot after a re-launch / hardware swap.
 *
 * The desktop calls this on every launch to detect:
 *   - Newly issued licenses (purchase or gift), so it can auto-activate
 *   - Revoked / refunded licenses, so it can lockdown
 *   - Slot eviction by the customer from the dashboard
 *   - Hardware-fingerprint refresh (the same 2-of-3 component matching
 *     used by /api/atelier/activate)
 *
 * The license `key_string` IS returned on this endpoint, distinct
 * from /api/atelier/my-licenses which suppresses it. Reasoning: this
 * route is only reachable with an Authorization: Bearer JWT from the
 * customer's account, so the caller is by-definition the owner of
 * every returned license. Returning key_string lets a freshly-signed-
 * in Atelier install persist the same `license_string` it would have
 * received via manual paste — the existing local Ed25519 verification
 * + per-boot health check pipeline runs unchanged on the auto-
 * activated path. The portal endpoint omits key_string because that
 * surface is reachable from any tab in the customer's browser; this
 * surface is reachable only by a holder of the JWT and we accept that
 * trust boundary.
 *
 * Optional query: ?machine_id_windows_guid=...&...&motherboard_serial=...
 * &cpu_id=... — when supplied, the response includes is_current_device
 * for each slot so the desktop UI can highlight which slot belongs to
 * the running install. Hashes are sha256 hex digests; the route does
 * NOT validate them strictly because they're not auth material here —
 * the worst-case is a wrong is_current_device flag, which is purely
 * cosmetic.
 */

interface EntitlementSlot {
  activation_id: string;
  device_label: string;
  atelier_version: string;
  first_activated_at: string;
  last_heartbeat_at: string;
  is_current_device: boolean;
}

interface EntitlementLicense {
  lid: string;
  /** Canonical Ed25519-signed license string. See file-level docstring
   *  on why this is included on the entitlements route but suppressed
   *  on the portal route. */
  key_string: string;
  product: "atelier";
  version_major: number;
  tier: AtelierLicenseRecord["tier"];
  issued_at: string;
  status: AtelierLicenseRecord["status"];
  revocation_mode?: AtelierLicenseRecord["revocation_mode"] | null;
  revoked_at?: string | null;
  slots_used: number;
  max_slots: number;
  active_slots: EntitlementSlot[];
  has_current_device_slot: boolean;
}

function projectSlot(
  a: AtelierActivation,
  isCurrent: boolean,
): EntitlementSlot {
  return {
    activation_id: a.activation_id,
    device_label: a.device_label,
    atelier_version: a.atelier_version,
    first_activated_at: a.first_activated_at,
    last_heartbeat_at: a.last_heartbeat_at,
    is_current_device: isCurrent,
  };
}

export async function GET(request: Request) {
  const session = await getCurrentSessionAny(request);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const windows_guid = url.searchParams.get("windows_guid");
  const motherboard_serial = url.searchParams.get("motherboard_serial");
  const cpu_id = url.searchParams.get("cpu_id");
  const callerMachine =
    windows_guid && motherboard_serial && cpu_id
      ? { windows_guid, motherboard_serial, cpu_id }
      : null;

  const licenses = await listLicensesForAccountWithFallback(
    session.account.accountId,
    session.account.email,
  );
  const projected: EntitlementLicense[] = await Promise.all(
    licenses.map(async (license) => {
      const activations = await getActivationsForLicense(license.lid);
      const active = activations.filter((a) => a.status === "active");
      const slots: EntitlementSlot[] = active.map((a) => {
        const isCurrent = callerMachine
          ? matchesMachine(a.machine_id, callerMachine)
          : false;
        return projectSlot(a, isCurrent);
      });
      return {
        lid: license.lid,
        key_string: license.key_string,
        product: license.product,
        version_major: license.version_major,
        tier: license.tier,
        issued_at: license.issued_at,
        status: license.status,
        revocation_mode: license.revocation_mode ?? null,
        revoked_at: license.revoked_at ?? null,
        slots_used: active.length,
        max_slots: MAX_ACTIVATIONS_PER_LICENSE,
        active_slots: slots,
        has_current_device_slot: slots.some((s) => s.is_current_device),
      };
    }),
  );

  // Newest licenses first — most accounts have one, but the chooser
  // modal in Atelier shows the most recent at top for multi-license
  // edge cases (gifts, household, agency staff).
  projected.sort((a, b) => b.issued_at.localeCompare(a.issued_at));

  return NextResponse.json({
    ok: true,
    account: toPublicAccount(session.account),
    licenses: projected,
  });
}
