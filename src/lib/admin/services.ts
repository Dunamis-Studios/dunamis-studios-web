import {
  getAccountById,
  saveAccount,
  rotateAccountEmail,
  softDeleteAccount,
  getEntitlementsForAccount,
} from "@/lib/accounts";
import type { Account, Entitlement } from "@/lib/types";
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
import {
  buildAccountDataExport,
  type AccountDataExport,
} from "@/lib/data-export";
import { stripe } from "@/lib/stripe";

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

// --------------------------------------------------------------------
// service_admin_update_account_profile
// --------------------------------------------------------------------

export interface UpdateAccountProfileParams {
  accountId: string;
  adminEmail: string;
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
  email?: string;
}

export interface UpdateAccountProfileResult {
  accountId: string;
  changed: Record<string, { from: unknown; to: unknown }>;
}

export async function service_admin_update_account_profile(
  params: UpdateAccountProfileParams,
): Promise<UpdateAccountProfileResult> {
  const existing = await getAccountById(params.accountId);
  if (!existing) {
    throw new AdminActionError(404, "account not found", {
      account_id: params.accountId,
    });
  }

  const changed: Record<string, { from: unknown; to: unknown }> = {};
  const next: Account = { ...existing };

  if (
    params.firstName !== undefined &&
    params.firstName !== existing.firstName
  ) {
    changed.firstName = { from: existing.firstName, to: params.firstName };
    next.firstName = params.firstName;
  }
  if (
    params.lastName !== undefined &&
    params.lastName !== existing.lastName
  ) {
    changed.lastName = { from: existing.lastName, to: params.lastName };
    next.lastName = params.lastName;
  }
  if (
    params.companyName !== undefined &&
    (params.companyName ?? null) !== (existing.companyName ?? null)
  ) {
    changed.companyName = {
      from: existing.companyName ?? null,
      to: params.companyName ?? null,
    };
    next.companyName = params.companyName ?? null;
  }

  let emailRotated = false;
  if (
    params.email !== undefined &&
    params.email.toLowerCase() !== existing.email.toLowerCase()
  ) {
    changed.email = { from: existing.email, to: params.email };
    next.email = params.email;
    emailRotated = true;
  }

  if (Object.keys(changed).length === 0) {
    throw new AdminActionError(409, "no fields changed", {
      account_id: params.accountId,
    });
  }

  next.updatedAt = new Date().toISOString();

  if (emailRotated) {
    await rotateAccountEmail(next, existing.email);
  } else {
    await saveAccount(next);
  }

  return { accountId: params.accountId, changed };
}

// --------------------------------------------------------------------
// service_admin_delete_account
// --------------------------------------------------------------------

export interface DeleteAccountParams {
  accountId: string;
  adminEmail: string;
  reason: string;
}

export interface DeleteAccountResult {
  accountId: string;
  email: string;
  deletedAt: string;
  recoveryWindowDays: 30;
}

export async function service_admin_delete_account(
  params: DeleteAccountParams,
): Promise<DeleteAccountResult> {
  const existing = await getAccountById(params.accountId);
  if (!existing) {
    throw new AdminActionError(404, "account not found", {
      account_id: params.accountId,
    });
  }
  if (existing.deletedAt) {
    throw new AdminActionError(409, "account already soft-deleted", {
      account_id: params.accountId,
      deleted_at: existing.deletedAt,
    });
  }

  await softDeleteAccount(params.accountId);
  const after = await getAccountById(params.accountId);
  const deletedAt = after?.deletedAt ?? new Date().toISOString();

  return {
    accountId: params.accountId,
    email: existing.email,
    deletedAt,
    recoveryWindowDays: 30,
  };
}

// --------------------------------------------------------------------
// service_admin_trigger_data_export
// --------------------------------------------------------------------

export interface TriggerDataExportParams {
  accountId: string;
  adminEmail: string;
}

export interface TriggerDataExportResult {
  accountId: string;
  filename: string;
  generatedAt: string;
  export: AccountDataExport;
}

/**
 * Admin-initiated copy of the customer-facing data export. Reuses the
 * same builder; the admin route returns the JSON inline and the audit
 * log records the action with the file name + generated_at timestamp.
 * The customer is NOT notified by default. A future variant can email
 * the export to the customer's address on request.
 */
export async function service_admin_trigger_data_export(
  params: TriggerDataExportParams,
): Promise<TriggerDataExportResult> {
  const account = await getAccountById(params.accountId);
  if (!account) {
    throw new AdminActionError(404, "account not found", {
      account_id: params.accountId,
    });
  }
  const data = await buildAccountDataExport(params.accountId);
  const { dataExportFilename } = await import("@/lib/data-export");
  const filename = dataExportFilename(account.email);
  return {
    accountId: params.accountId,
    filename,
    generatedAt: data.generated_at,
    export: data,
  };
}

// --------------------------------------------------------------------
// service_admin_refresh_from_stripe
// --------------------------------------------------------------------

export interface RefreshFromStripeParams {
  accountId: string;
  adminEmail: string;
}

export interface StripeEntitlementSnapshot {
  product: Entitlement["product"];
  portalId: string;
  stripeCustomerId: string | null;
  stripeCustomerEmail: string | null;
  stripeCustomerDeleted: boolean;
  activeSubscriptions: Array<{
    id: string;
    status: string;
    currentPeriodEnd: number;
    priceId: string | null;
  }>;
  recentPaymentIntents: Array<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    created: number;
  }>;
}

export interface RefreshFromStripeResult {
  accountId: string;
  entitlementCount: number;
  snapshots: StripeEntitlementSnapshot[];
  errors: Array<{ portalId: string; product: string; message: string }>;
}

interface StripeFetchOutcome {
  snapshot?: StripeEntitlementSnapshot;
  error?: { portalId: string; product: string; message: string };
}

async function fetchEntitlementStripeSnapshot(
  ent: Entitlement,
): Promise<StripeFetchOutcome> {
  const cid = ent.stripeCustomerId ?? null;
  if (!cid) {
    return {
      snapshot: {
        product: ent.product,
        portalId: ent.portalId,
        stripeCustomerId: null,
        stripeCustomerEmail: null,
        stripeCustomerDeleted: false,
        activeSubscriptions: [],
        recentPaymentIntents: [],
      },
    };
  }

  try {
    const s = stripe();
    const customer = await s.customers.retrieve(cid);
    const customerDeleted =
      "deleted" in customer && customer.deleted === true;
    const stripeCustomerEmail =
      !customerDeleted && "email" in customer ? customer.email : null;

    const [subs, pis] = await Promise.all([
      customerDeleted
        ? Promise.resolve({ data: [] })
        : s.subscriptions.list({
            customer: cid,
            status: "all",
            limit: 10,
          }),
      customerDeleted
        ? Promise.resolve({ data: [] })
        : s.paymentIntents.list({ customer: cid, limit: 10 }),
    ]);

    return {
      snapshot: {
        product: ent.product,
        portalId: ent.portalId,
        stripeCustomerId: cid,
        stripeCustomerEmail,
        stripeCustomerDeleted: customerDeleted,
        activeSubscriptions: subs.data
          .filter((sub) =>
            ["trialing", "active", "past_due", "incomplete"].includes(
              sub.status,
            ),
          )
          .map((sub) => ({
            id: sub.id,
            status: sub.status,
            currentPeriodEnd: sub.items.data[0]?.current_period_end ?? 0,
            priceId: sub.items.data[0]?.price.id ?? null,
          })),
        recentPaymentIntents: pis.data.map((pi) => ({
          id: pi.id,
          status: pi.status,
          amount: pi.amount,
          currency: pi.currency,
          created: pi.created,
        })),
      },
    };
  } catch (err) {
    return {
      error: {
        portalId: ent.portalId,
        product: ent.product,
        message: err instanceof Error ? err.message : "stripe error",
      },
    };
  }
}

/**
 * Read-only diagnostic. Walks every entitlement on the account, queries
 * Stripe for the current customer + active subscriptions + recent
 * payment intents, and returns the consolidated view. No local writes
 * happen in this first cut. Admin uses the output to spot drift between
 * Dunamis state and Stripe state; auto-reconciliation lands in a
 * follow-up once the drift shape is understood.
 */
export async function service_admin_refresh_from_stripe(
  params: RefreshFromStripeParams,
): Promise<RefreshFromStripeResult> {
  const account = await getAccountById(params.accountId);
  if (!account) {
    throw new AdminActionError(404, "account not found", {
      account_id: params.accountId,
    });
  }

  const entitlements = await getEntitlementsForAccount(params.accountId);
  const outcomes = await Promise.all(
    entitlements.map((ent) => fetchEntitlementStripeSnapshot(ent)),
  );

  const snapshots: StripeEntitlementSnapshot[] = [];
  const errors: RefreshFromStripeResult["errors"] = [];
  for (const o of outcomes) {
    if (o.snapshot) snapshots.push(o.snapshot);
    if (o.error) errors.push(o.error);
  }

  return {
    accountId: params.accountId,
    entitlementCount: entitlements.length,
    snapshots,
    errors,
  };
}

// --------------------------------------------------------------------
// service_admin_set_refund_flag
// --------------------------------------------------------------------

export interface SetRefundFlagParams {
  accountId: string;
  lid: string;
  adminEmail: string;
}

export async function service_admin_set_refund_flag(
  params: SetRefundFlagParams,
): Promise<{ lid: string; previous_status: string; new_status: "refunded" }> {
  const existing = await ownedLicense(params.accountId, params.lid);

  if (existing.status === "refunded") {
    throw new AdminActionError(409, "license already refunded", {
      lid: params.lid,
    });
  }

  await setLicenseStatus(params.lid, "refunded");

  return {
    lid: params.lid,
    previous_status: existing.status,
    new_status: "refunded",
  };
}
