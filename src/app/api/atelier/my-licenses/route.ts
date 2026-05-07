import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/session";
import {
  type AtelierLicenseRecord,
  listLicensesByEmail,
} from "@/lib/atelier-license-signing";
import {
  type AtelierActivation,
  MAX_ACTIVATIONS_PER_LICENSE,
  getActivationsForLicense,
} from "@/lib/atelier-activation";

/**
 * GET /api/atelier/my-licenses
 *
 * Auth: signed-in account session. Returns every Atelier license
 * tied to the account's email plus the activation slots for each
 * license. Used by /account/atelier-licenses to render the customer
 * portal.
 *
 * The license string itself is NOT returned — the portal only needs
 * lid + status + slots, not the cryptographic license. Customers who
 * have lost their license string use the dedicated lookup endpoint
 * (/api/atelier/lookup-license), which mails it to the verified
 * inbox; the portal does not become a license-leak surface.
 */

interface PortalSlot {
  activation_id: string;
  device_label: string;
  atelier_version: string;
  first_activated_at: string;
  last_heartbeat_at: string;
  is_current_device?: boolean;
}

interface PortalLicense {
  lid: string;
  product: "atelier";
  version_major: number;
  tier: string;
  issued_at: string;
  status: AtelierLicenseRecord["status"];
  revocation_mode?: AtelierLicenseRecord["revocation_mode"];
  revoked_at?: string | null;
  slots_used: number;
  max_slots: number;
  active_slots: PortalSlot[];
  deactivated_slots: PortalSlot[];
}

function projectSlot(a: AtelierActivation): PortalSlot {
  return {
    activation_id: a.activation_id,
    device_label: a.device_label,
    atelier_version: a.atelier_version,
    first_activated_at: a.first_activated_at,
    last_heartbeat_at: a.last_heartbeat_at,
  };
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const licenses = await listLicensesByEmail(session.account.email);
  const projected: PortalLicense[] = await Promise.all(
    licenses.map(async (license) => {
      const activations = await getActivationsForLicense(license.lid);
      const active = activations.filter((a) => a.status === "active");
      const deactivated = activations.filter((a) => a.status === "deactivated");
      return {
        lid: license.lid,
        product: license.product,
        version_major: license.version_major,
        tier: license.tier,
        issued_at: license.issued_at,
        status: license.status,
        revocation_mode: license.revocation_mode ?? null,
        revoked_at: license.revoked_at ?? null,
        slots_used: active.length,
        max_slots: MAX_ACTIVATIONS_PER_LICENSE,
        active_slots: active.map(projectSlot),
        deactivated_slots: deactivated.map(projectSlot),
      };
    }),
  );

  // Newest licenses first — most customers have one, but a re-purchase
  // case still reads naturally with the latest at top.
  projected.sort((a, b) => b.issued_at.localeCompare(a.issued_at));

  return NextResponse.json({
    ok: true,
    licenses: projected,
  });
}
