import { getAccountById } from "@/lib/accounts";
import {
  getLicense,
  setLicenseStatus,
  type AtelierLicenseRecord,
} from "@/lib/atelier-license-signing";
import {
  getActivation,
  deactivateActivation,
} from "@/lib/atelier-activation";
import { sendAtelierLicenseEmail } from "@/lib/email-atelier-license";

import { AdminActionError } from "@/lib/admin/action-runner";

/**
 * Admin service layer. Each `service_admin_*` function:
 *   - Validates that the resource exists and belongs to the named
 *     account (cross-account writes are a class of bug worth
 *     defending against at the service boundary, not just in the
 *     route handler).
 *   - Calls the underlying domain helper (setLicenseStatus,
 *     deactivateActivation, sendAtelierLicenseEmail, etc.).
 *   - Returns enough context for the route handler's audit-log
 *     parameters block: resource IDs touched, status flips applied,
 *     old/new email values, etc.
 *
 * Failures throw AdminActionError with a deliberate HTTP status code
 * so the route handler can surface "license not found" as a 404
 * separate from "license belongs to a different account" as a 403,
 * separate from "license already revoked" as a 409.
 */

// --------------------------------------------------------------------
// Shared validation helpers
// --------------------------------------------------------------------

async function ownedLicense(
  accountId: string,
  lid: string,
): Promise<AtelierLicenseRecord> {
  const lic = await getLicense(lid);
  if (!lic) {
    throw new AdminActionError(404, `license ${lid} not found`, {
      lid,
    });
  }
  if (lic.account_id && lic.account_id !== accountId) {
    throw new AdminActionError(
      403,
      `license ${lid} belongs to a different account`,
      { lid, owning_account_id: lic.account_id },
    );
  }
  return lic;
}

// --------------------------------------------------------------------
// service_admin_deactivate_device
// --------------------------------------------------------------------

export interface DeactivateDeviceParams {
  accountId: string;
  activationId: string;
  adminEmail: string;
  reason?: string;
}

export async function service_admin_deactivate_device(
  params: DeactivateDeviceParams,
): Promise<{ activation_id: string; lid: string }> {
  const existing = await getActivation(params.activationId);
  if (!existing) {
    throw new AdminActionError(
      404,
      `activation ${params.activationId} not found`,
      { activation_id: params.activationId },
    );
  }
  // Validate the activation's license belongs to the named account.
  await ownedLicense(params.accountId, existing.lid);

  if (existing.status === "deactivated") {
    throw new AdminActionError(409, "activation already deactivated", {
      activation_id: params.activationId,
      lid: existing.lid,
    });
  }

  await deactivateActivation(params.activationId, "admin");

  return { activation_id: params.activationId, lid: existing.lid };
}

// --------------------------------------------------------------------
// service_admin_revoke_license
// --------------------------------------------------------------------

export interface RevokeLicenseParams {
  accountId: string;
  lid: string;
  adminEmail: string;
  reason: string;
  /** "immediate" hard-locks within minutes; "grace_14d" gives a window. */
  revocationMode?: "immediate" | "grace_14d";
}

export async function service_admin_revoke_license(
  params: RevokeLicenseParams,
): Promise<{ lid: string; previous_status: string; new_status: "revoked" }> {
  const existing = await ownedLicense(params.accountId, params.lid);

  if (existing.status === "revoked") {
    throw new AdminActionError(409, "license already revoked", {
      lid: params.lid,
    });
  }

  await setLicenseStatus(params.lid, "revoked", {
    revocation_mode: params.revocationMode ?? "grace_14d",
    revocation_reason: params.reason,
    revoked_by_admin_email: params.adminEmail,
  });

  return {
    lid: params.lid,
    previous_status: existing.status,
    new_status: "revoked",
  };
}

// --------------------------------------------------------------------
// service_admin_resend_license_email
// --------------------------------------------------------------------

export interface ResendLicenseEmailParams {
  accountId: string;
  lid: string;
  adminEmail: string;
}

export async function service_admin_resend_license_email(
  params: ResendLicenseEmailParams,
): Promise<{ lid: string; sent_to: string }> {
  const license = await ownedLicense(params.accountId, params.lid);
  const account = await getAccountById(params.accountId);
  if (!account) {
    throw new AdminActionError(404, "account not found", {
      lid: params.lid,
    });
  }

  // Send to the account's current email (which may differ from the
  // license's snapshotted email if the customer rotated their address).
  await sendAtelierLicenseEmail({
    to: account.email,
    firstName: account.firstName ?? null,
    licenseString: license.key_string,
    isResend: true,
  });

  return { lid: params.lid, sent_to: account.email };
}
