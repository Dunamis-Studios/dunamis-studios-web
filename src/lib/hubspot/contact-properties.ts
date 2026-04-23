import "server-only";

import type {
  AccountCreatedProperties,
  AppInstalledProperties,
  AppUninstalledProperties,
  EventPayloads,
  HubspotTier,
  LicenseRefundedProperties,
  ProductAppName,
  PurchaseCompletedProperties,
  SubscriptionPaymentFailedProperties,
  SubscriptionRenewedProperties,
  TermsAcceptedProperties,
  TrackingEventType,
} from "./events";
import {
  ContactPatch,
  getContactByEmail,
  incrementContactProperty,
} from "./client";

/**
 * Convert an internal tier string (any case — e.g., the lowercase
 * EntitlementTier used in src/lib/types.ts) into the HubSpot dropdown
 * option value HubSpot stores. Returns null for empty/unknown input so
 * the caller can omit the property from the patch and leave HubSpot's
 * current value unchanged.
 *
 * Use this at every wire-up site that takes an internal tier and hands
 * it to trackEvent — it keeps the "HubSpot dropdown values are the
 * literal label" rule (see parent CLAUDE.md) in one place.
 */
export function toHubspotTier(
  internal: string | null | undefined,
): HubspotTier | null {
  if (!internal) return null;
  switch (internal.toLowerCase()) {
    case "none":
      return "None";
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    case "enterprise":
      return "Enterprise";
    default:
      return null;
  }
}

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
      account_status: "Active",
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
  const increments: Increments[] = [
    { property: "lifetime_value_cents", delta: p.amount_cents },
  ];
  if (p.license_type === "one_time" && p.app_name === "property-pulse") {
    patch.property_pulse_installed = "true";
    patch.property_pulse_license_status = "Paid";
    patch.property_pulse_purchase_date = ts;
    increments.push({ property: "property_pulse_install_count", delta: 1 });
  }
  if (p.license_type === "subscription" && p.app_name === "debrief") {
    patch.debrief_installed = "true";
    patch.debrief_subscription_status = "Active";
    if (p.tier) patch.debrief_tier = p.tier;
    increments.push({ property: "debrief_install_count", delta: 1 });
  }
  return { patch, increments };
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
    patch.debrief_subscription_status = "Active";
    patch.debrief_tier = p.tier;
    // Renewal = new billing period starts = monthly allotment resets.
    // Absolute value (not increment) because the allotment is the new
    // ceiling, not a delta on the prior month's remaining balance.
    patch.debrief_credits_remaining = p.credits_granted;
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
    patch.debrief_subscription_status = "Past Due";
  }
  return { patch, increments: [] };
}

function deriveLicenseRefunded(
  p: LicenseRefundedProperties,
): EventContactUpdates {
  const patch: ContactPatch = { dunamis_account_id: p.dunamis_account_id };
  if (p.app_name === "property-pulse") {
    patch.property_pulse_license_status = "Refunded";
    // One-time license refund revokes the install. If the admin
    // reinstalls after a refund dispute, the next purchase_completed
    // flips this back to "true".
    patch.property_pulse_installed = "false";
  }
  if (p.app_name === "debrief") {
    patch.debrief_subscription_status = "Cancelled";
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
  switch (p.document_type) {
    case "tos":
      patch.tos_version_accepted = p.document_version;
      patch.tos_accepted_at = ts;
      break;
    case "privacy":
      patch.privacy_version_accepted = p.document_version;
      patch.privacy_accepted_at = ts;
      break;
    case "dpa":
      patch.dpa_version_accepted = p.document_version;
      patch.dpa_accepted_at = ts;
      break;
    case "debrief_addendum":
      patch.debrief_addendum_version_accepted = p.document_version;
      patch.debrief_addendum_accepted_at = ts;
      break;
    case "property_pulse_addendum":
      patch.property_pulse_addendum_version_accepted = p.document_version;
      patch.property_pulse_addendum_accepted_at = ts;
      break;
  }
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

/**
 * Build an account-level HubSpot contact patch from Account record
 * fields. Used at every HubSpot sync site — signup, claim-link, and
 * every Stripe webhook helper — so contact-level state (account id,
 * created-at, status, consent versions + timestamps) is re-stamped
 * consistently on every sync, not just at signup. Missing fields are
 * omitted from the patch (HubSpot keeps whatever it had), so legacy
 * accounts that pre-date consent persistence don't lose existing
 * HubSpot data.
 *
 * Takes primitives rather than the Account type so src/lib/hubspot/*
 * stays decoupled from src/lib/types.ts — callers destructure their
 * local Account instance and pass through.
 */
export function buildAccountContactPatch(args: {
  accountId: string;
  createdAt: string;
  deletedAt?: string | null;
  tosVersion?: string;
  tosAcceptedAt?: string;
  privacyVersion?: string;
  privacyAcceptedAt?: string;
  dpaVersion?: string;
  dpaAcceptedAt?: string;
  debriefAddendumVersion?: string;
  debriefAddendumAcceptedAt?: string;
  propertyPulseAddendumVersion?: string;
  propertyPulseAddendumAcceptedAt?: string;
}): ContactPatch {
  const patch: ContactPatch = {
    dunamis_account_id: args.accountId,
    account_created_at: args.createdAt,
    account_status: args.deletedAt ? "Cancelled" : "Active",
  };
  if (args.tosVersion) patch.tos_version_accepted = args.tosVersion;
  if (args.tosAcceptedAt) patch.tos_accepted_at = args.tosAcceptedAt;
  if (args.privacyVersion) patch.privacy_version_accepted = args.privacyVersion;
  if (args.privacyAcceptedAt) patch.privacy_accepted_at = args.privacyAcceptedAt;
  if (args.dpaVersion) patch.dpa_version_accepted = args.dpaVersion;
  if (args.dpaAcceptedAt) patch.dpa_accepted_at = args.dpaAcceptedAt;
  if (args.debriefAddendumVersion) {
    patch.debrief_addendum_version_accepted = args.debriefAddendumVersion;
  }
  if (args.debriefAddendumAcceptedAt) {
    patch.debrief_addendum_accepted_at = args.debriefAddendumAcceptedAt;
  }
  if (args.propertyPulseAddendumVersion) {
    patch.property_pulse_addendum_version_accepted =
      args.propertyPulseAddendumVersion;
  }
  if (args.propertyPulseAddendumAcceptedAt) {
    patch.property_pulse_addendum_accepted_at =
      args.propertyPulseAddendumAcceptedAt;
  }
  return patch;
}

/**
 * Build the additionalContactPatch for install-surfacing events
 * (app_installed from the claim link path, purchase_completed from
 * the Stripe webhook path). Sets stripe_customer_id when one is
 * available, and sets *_first_install_at only if the contact doesn't
 * already have it — read-before-write so re-subscribes or re-installs
 * don't overwrite the original install date.
 *
 * Shared across every install-surfacing wire-up so the first-install
 * semantics are defined once. If the lookup against HubSpot fails
 * (network blip, rate limit), the timestamp is stamped anyway — a
 * too-fresh date is a better failure mode than a blank field an
 * analyst has to chase. Subsequent successful wire-ups won't overwrite
 * the existing value.
 */
export async function buildInstallContactPatch({
  email,
  appName,
  customerId,
}: {
  email: string;
  appName: ProductAppName;
  customerId?: string | null;
}): Promise<ContactPatch> {
  const firstInstallProp =
    appName === "debrief"
      ? "debrief_first_install_at"
      : "property_pulse_first_install_at";
  const patch: ContactPatch = {};
  if (customerId) patch.stripe_customer_id = customerId;
  try {
    const existing = await getContactByEmail(email, [firstInstallProp]);
    if (!existing?.properties?.[firstInstallProp]) {
      patch[firstInstallProp] = new Date().toISOString();
    }
  } catch {
    patch[firstInstallProp] = new Date().toISOString();
  }
  return patch;
}
