import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import {
  type AtelierLicenseRecord,
  listLicensesForAccountWithFallback,
} from "@/lib/atelier-license-signing";
import {
  type AtelierActivation,
  MAX_ACTIVATIONS_PER_LICENSE,
  getActivationsForLicense,
} from "@/lib/atelier-activation";
import { PageHeader } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { AtelierLicensesPanel } from "@/components/account/atelier-licenses-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Atelier licenses",
  robots: { index: false, follow: false },
};

/**
 * Customer portal for Atelier licenses. Renders every license tied
 * to the signed-in account's email plus the per-license activation
 * slots, with deactivate-and-rename actions on each active slot.
 *
 * Server-component shell does the initial fetch; the client panel
 * receives the projected data and handles user interactions
 * (deactivate, rename) via /api/atelier/* endpoints.
 */
export default async function AtelierLicensesPage() {
  const s = await getCurrentSession();
  if (!s) return null;

  const licenses = await listLicensesForAccountWithFallback(
    s.account.accountId,
    s.account.email,
  );
  const data = await Promise.all(
    licenses.map(async (license) => projectLicense(license)),
  );
  data.sort((a, b) => b.issued_at.localeCompare(a.issued_at));

  return (
    <>
      <PageHeader
        eyebrow="Atelier"
        title="Your Atelier licenses"
        description="Every Atelier license tied to your account, with the three activation slots per license. Deactivate any device to free a slot — useful when a laptop is lost, sold, or replaced and you can't reach the device itself."
      />

      <div className="mt-10">
        {data.length === 0 ? (
          <EmptyState
            icon={<KeyRound className="h-5 w-5" />}
            title="No Atelier licenses on this account yet."
            description="Once you've purchased Atelier, your licenses will appear here automatically. The same surface lives inside Atelier itself at Settings → License."
          />
        ) : (
          <AtelierLicensesPanel licenses={data} />
        )}
      </div>
    </>
  );
}

export interface PortalLicense {
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

export interface PortalSlot {
  activation_id: string;
  device_label: string;
  atelier_version: string;
  first_activated_at: string;
  last_heartbeat_at: string;
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

async function projectLicense(
  license: AtelierLicenseRecord,
): Promise<PortalLicense> {
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
}
