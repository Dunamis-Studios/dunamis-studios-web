import "server-only";

import type {
  AccountCreatedProperties,
  AppInstalledProperties,
  AppUninstalledProperties,
  EventPayloads,
  LicenseRefundedProperties,
  PurchaseCompletedProperties,
  SubscriptionPaymentFailedProperties,
  SubscriptionRenewedProperties,
  TermsAcceptedProperties,
  TrackingEventType,
} from "./events";
import { ContactPatch, incrementContactProperty } from "./client";

/**
 * Canonical list of the 23 custom contact properties in HubSpot portal
 * 20867488. Provided for reference and to keep the set of property keys
 * used by derivers in one place. Do NOT add keys here that don't exist
 * as real contact properties in HubSpot — writes to undefined properties
 * return 400 from the API.
 */
export const DUNAMIS_CONTACT_PROPERTIES = {
  // Account
  dunamis_account_id: "dunamis_account_id",
  account_created_at: "account_created_at",
  account_status: "account_status",
  // Debrief
  debrief_installed: "debrief_installed",
  debrief_install_count: "debrief_install_count",
  debrief_tier: "debrief_tier",
  debrief_subscription_status: "debrief_subscription_status",
  debrief_credits_remaining: "debrief_credits_remaining",
  debrief_first_install_at: "debrief_first_install_at",
  debrief_last_brief_generated_at: "debrief_last_brief_generated_at",
  // Property Pulse
  property_pulse_installed: "property_pulse_installed",
  property_pulse_install_count: "property_pulse_install_count",
  property_pulse_license_status: "property_pulse_license_status",
  property_pulse_first_install_at: "property_pulse_first_install_at",
  property_pulse_purchase_date: "property_pulse_purchase_date",
  // Billing
  lifetime_value_cents: "lifetime_value_cents",
  last_payment_at: "last_payment_at",
  last_payment_failed_at: "last_payment_failed_at",
  stripe_customer_id: "stripe_customer_id",
  // Legal
  tos_version_accepted: "tos_version_accepted",
  tos_accepted_at: "tos_accepted_at",
  privacy_version_accepted: "privacy_version_accepted",
  privacy_accepted_at: "privacy_accepted_at",
} as const;

/**
 * Properties that accumulate and can't be expressed as absolute-value
 * PATCH updates. Handled out-of-band by incrementContactProperty after
 * the deriver runs. Keep this list tight — every entry here costs an
 * extra API round-trip per event (read before write).
 */
interface Increments {
  property: string;
  delta: number;
}

export interface EventContactUpdates {
  patch: ContactPatch;
  increments: Increments[];
}

function deriveAccountCreated(
  p: AccountCreatedProperties,
  ts: string,
): EventContactUpdates {
  return {
    patch: {
      dunamis_account_id: p.dunamis_account_id,
      account_created_at: ts,
      account_status: "active",
    },
    increments: [],
  };
}

function deriveAppInstalled(
  p: AppInstalledProperties,
): EventContactUpdates {
  const patch: ContactPatch = { dunamis_account_id: p.dunamis_account_id };
  const increments: Increments[] = [];
  if (p.app_name === "debrief") {
    patch.debrief_installed = "true";
    // first_install_at intentionally omitted — caller sets it only on the
    // first install for this account (tracked out-of-band, e.g., via a
    // read-then-set when entitlement status transitions from 'incomplete'
    // to 'active' for the first time). We increment install_count here
    // unconditionally so re-installs are visible.
    increments.push({ property: "debrief_install_count", delta: 1 });
  } else if (p.app_name === "property-pulse") {
    patch.property_pulse_installed = "true";
    increments.push({ property: "property_pulse_install_count", delta: 1 });
  }
  return { patch, increments };
}

function deriveAppUninstalled(
  p: AppUninstalledProperties,
): EventContactUpdates {
  const patch: ContactPatch = { dunamis_account_id: p.dunamis_account_id };
  if (p.app_name === "debrief") {
    patch.debrief_installed = "false";
  } else if (p.app_name === "property-pulse") {
    patch.property_pulse_installed = "false";
  }
  return { patch, increments: [] };
}

function derivePurchaseCompleted(
  p: PurchaseCompletedProperties,
  ts: string,
): EventContactUpdates {
  const patch: ContactPatch = {
    dunamis_account_id: p.dunamis_account_id,
    last_payment_at: ts,
  };
  if (p.license_type === "one_time" && p.app_name === "property-pulse") {
    patch.property_pulse_license_status = "paid";
    patch.property_pulse_purchase_date = ts;
  }
  if (p.license_type === "subscription" && p.app_name === "debrief") {
    patch.debrief_subscription_status = "active";
    if (p.tier) patch.debrief_tier = p.tier;
  }
  return {
    patch,
    increments: [{ property: "lifetime_value_cents", delta: p.amount_cents }],
  };
}

function deriveSubscriptionRenewed(
  p: SubscriptionRenewedProperties,
  ts: string,
): EventContactUpdates {
  const patch: ContactPatch = {
    dunamis_account_id: p.dunamis_account_id,
    last_payment_at: ts,
  };
  if (p.app_name === "debrief") {
    patch.debrief_subscription_status = "active";
    patch.debrief_tier = p.tier;
  }
  return {
    patch,
    increments: [{ property: "lifetime_value_cents", delta: p.amount_cents }],
  };
}

function deriveSubscriptionPaymentFailed(
  p: SubscriptionPaymentFailedProperties,
  ts: string,
): EventContactUpdates {
  const patch: ContactPatch = {
    dunamis_account_id: p.dunamis_account_id,
    last_payment_failed_at: ts,
  };
  if (p.app_name === "debrief") {
    patch.debrief_subscription_status = "past_due";
  }
  return { patch, increments: [] };
}

function deriveLicenseRefunded(
  p: LicenseRefundedProperties,
): EventContactUpdates {
  const patch: ContactPatch = { dunamis_account_id: p.dunamis_account_id };
  if (p.app_name === "property-pulse") {
    patch.property_pulse_license_status = "refunded";
  }
  if (p.app_name === "debrief") {
    patch.debrief_subscription_status = "canceled";
  }
  return {
    patch,
    // Refunds decrement lifetime value. Delta is negative so the
    // increment helper subtracts from the running total.
    increments: [
      { property: "lifetime_value_cents", delta: -p.refund_amount_cents },
    ],
  };
}

function deriveTermsAccepted(
  p: TermsAcceptedProperties,
  ts: string,
): EventContactUpdates {
  const patch: ContactPatch = { dunamis_account_id: p.dunamis_account_id };
  if (p.document_type === "tos") {
    patch.tos_version_accepted = p.document_version;
    patch.tos_accepted_at = ts;
  } else if (p.document_type === "privacy") {
    patch.privacy_version_accepted = p.document_version;
    patch.privacy_accepted_at = ts;
  }
  // dpa acceptance has no dedicated contact property yet — event-only.
  return { patch, increments: [] };
}

/**
 * Given an event type and its typed payload, return the contact patch
 * (absolute values) and accumulator increments that should be applied
 * to the contact in HubSpot. The caller decides whether to actually
 * apply them; use applyEventContactUpdates() as the convenience
 * wrapper.
 */
export function deriveContactUpdates<K extends TrackingEventType>(
  type: K,
  payload: EventPayloads[K],
  occurredAt: Date = new Date(),
): EventContactUpdates {
  const ts = occurredAt.toISOString();
  switch (type) {
    case "account_created":
      return deriveAccountCreated(payload as AccountCreatedProperties, ts);
    case "app_installed":
      return deriveAppInstalled(payload as AppInstalledProperties);
    case "app_uninstalled":
      return deriveAppUninstalled(payload as AppUninstalledProperties);
    case "purchase_completed":
      return derivePurchaseCompleted(payload as PurchaseCompletedProperties, ts);
    case "subscription_renewed":
      return deriveSubscriptionRenewed(
        payload as SubscriptionRenewedProperties,
        ts,
      );
    case "subscription_payment_failed":
      return deriveSubscriptionPaymentFailed(
        payload as SubscriptionPaymentFailedProperties,
        ts,
      );
    case "license_refunded":
      return deriveLicenseRefunded(payload as LicenseRefundedProperties);
    case "terms_accepted":
      return deriveTermsAccepted(payload as TermsAcceptedProperties, ts);
  }
}

/**
 * Apply the increments returned by deriveContactUpdates. The caller
 * is responsible for the PATCH portion via updateContactPropertiesByEmail
 * (or upsertContactByEmail); this function handles the read-modify-write
 * accumulators.
 */
export async function applyIncrements(
  email: string,
  increments: Increments[],
): Promise<void> {
  for (const { property, delta } of increments) {
    await incrementContactProperty(email, property, delta);
  }
}
