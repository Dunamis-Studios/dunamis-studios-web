import "server-only";

/**
 * Which Dunamis Studios app the event belongs to. Events that are not
 * tied to a product (e.g., direct website signup with no claim) carry
 * `"none"`. `"dunamis-site"` is reserved for events that are clearly
 * site-scoped (reserved for future use).
 */
export type AppName = "debrief" | "property-pulse" | "dunamis-site" | "none";

/**
 * AppName values that represent a real installable product. Product-
 * specific events (install, uninstall, purchase, refund, renewal) must
 * carry one of these.
 */
export type ProductAppName = Extract<AppName, "debrief" | "property-pulse">;

export type LicenseType = "subscription" | "one_time" | "credit_pack";

/**
 * HubSpot dropdown property values. Do NOT snake_case or lowercase —
 * HubSpot dropdown option internal values are the exact label string
 * as entered in the portal UI. Sending "active" to a property that
 * HubSpot has defined with option "Active" returns HTTP 400. See the
 * parent CLAUDE.md section "HubSpot property internal name behavior"
 * for the underlying rule.
 *
 * Source of truth: HubSpot portal 20867488 → Settings → Properties →
 * Contact properties → (property) → Edit. These unions must mirror
 * what is defined there.
 */
export type HubspotTier = "None" | "Starter" | "Pro" | "Enterprise";

export type HubspotSubscriptionStatus =
  | "None"
  | "Trial"
  | "Active"
  | "Past Due"
  | "Cancelled";

export type HubspotAccountStatus = "Active" | "Suspended" | "Cancelled";

export type HubspotLicenseStatus = "None" | "Beta" | "Paid" | "Refunded";

export type SignupSource = "website" | "hubspot_oauth_install";

export type UninstallReason =
  | "user_revoked_oauth"
  | "app_uninstalled_from_hubspot"
  | "account_deleted"
  | "unknown";

export type TermsDocumentType = "tos" | "privacy" | "dpa";

export type TermsAcceptedVia =
  | "signup_checkbox"
  | "re_acceptance_banner"
  | "account_settings"
  | "claim_flow";

/**
 * Canonical HubSpot event names. The `pe20867488_` prefix is the portal-
 * scoped tracking id format HubSpot assigns when a custom event is
 * defined in portal 20867488. Do not edit these strings unless the event
 * definition in HubSpot is renamed — the string must match exactly or
 * /events/v3/send returns 400.
 */
export const HUBSPOT_EVENT_NAMES = {
  account_created: "pe20867488_account_created",
  app_installed: "pe20867488_app_installed",
  app_uninstalled: "pe20867488_app_uninstalled",
  purchase_completed: "pe20867488_purchase_completed",
  subscription_renewed: "pe20867488_subscription_renewed",
  subscription_payment_failed: "pe20867488_subscription_payment_failed",
  license_refunded: "pe20867488_license_refunded",
  terms_accepted: "pe20867488_terms_accepted",
} as const;

export type TrackingEventType = keyof typeof HUBSPOT_EVENT_NAMES;

export interface AccountCreatedProperties {
  app_name: AppName;
  portal_id?: string;
  dunamis_account_id: string;
  signup_source: SignupSource;
}

export interface AppInstalledProperties {
  app_name: ProductAppName;
  portal_id: string;
  dunamis_account_id: string;
  hubspot_user_id: string;
  scopes_granted: string[];
}

export interface AppUninstalledProperties {
  app_name: ProductAppName;
  portal_id: string;
  dunamis_account_id: string;
  uninstall_reason: UninstallReason;
  days_since_install: number;
}

export interface PurchaseCompletedProperties {
  app_name: ProductAppName;
  portal_id: string;
  dunamis_account_id: string;
  amount_cents: number;
  currency: string;
  license_type: LicenseType;
  tier: HubspotTier | null;
  stripe_payment_intent_id: string;
}

export interface SubscriptionRenewedProperties {
  app_name: ProductAppName;
  portal_id: string;
  dunamis_account_id: string;
  tier: HubspotTier;
  amount_cents: number;
  credits_granted: number;
  stripe_subscription_id: string;
}

export interface SubscriptionPaymentFailedProperties {
  app_name: ProductAppName;
  portal_id: string;
  dunamis_account_id: string;
  tier: HubspotTier;
  amount_cents: number;
  failure_reason: string;
  retry_attempt: number;
  stripe_invoice_id: string;
}

export interface LicenseRefundedProperties {
  app_name: ProductAppName;
  portal_id: string;
  dunamis_account_id: string;
  refund_amount_cents: number;
  /**
   * Days between original purchase and refund. Optional because the
   * Stripe charge object doesn't carry a reliable purchase date —
   * omit rather than send a lying 0 / null. Callers that have a
   * trustworthy purchase date (e.g. from their own metadata) compute
   * and supply this; callers that don't leave it undefined and the
   * flattenProperties step drops it from the event payload.
   */
  days_since_install?: number;
  refund_reason: string;
  stripe_refund_id: string;
}

export interface TermsAcceptedProperties {
  dunamis_account_id: string;
  document_type: TermsDocumentType;
  document_version: string;
  accepted_via: TermsAcceptedVia;
  ip_address: string;
  user_agent: string;
}

/**
 * Type-level map from event type to its payload shape. Used by the
 * trackEvent() signature so callers can't send malformed payloads —
 * TypeScript narrows `properties` based on the `type` argument.
 */
export interface EventPayloads {
  account_created: AccountCreatedProperties;
  app_installed: AppInstalledProperties;
  app_uninstalled: AppUninstalledProperties;
  purchase_completed: PurchaseCompletedProperties;
  subscription_renewed: SubscriptionRenewedProperties;
  subscription_payment_failed: SubscriptionPaymentFailedProperties;
  license_refunded: LicenseRefundedProperties;
  terms_accepted: TermsAcceptedProperties;
}
