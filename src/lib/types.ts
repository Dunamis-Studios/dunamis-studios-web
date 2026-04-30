export type Product = "debrief" | "property-pulse";

export type EntitlementStatus =
  | "trial"
  | "active"
  | "incomplete"
  | "past_due"
  | "canceled";
export type EntitlementTier = "starter" | "pro" | "enterprise";

export interface Account {
  accountId: string;
  email: string;
  emailVerified: boolean;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  /**
   * User-controlled session lifetime in days. Applied at session creation
   * (login / signup / password-change / password-reset). Undefined on
   * legacy accounts falls back to the DEFAULT_SESSION_LIFETIME_DAYS
   * constant in src/lib/session.ts.
   */
  sessionLifetimeDays?: 1 | 3 | 7;
  /**
   * Versioned consent state, stamped at the moment the user accepts
   * each document (signup for ToS + Privacy, claim-link for DPA +
   * Service Addendum). Optional because each field only gets set at
   * its corresponding acceptance surface; HubSpot sync sites include
   * these in contact patches only when set, so missing values don't
   * clobber existing HubSpot contact state.
   *
   * Version-bump re-acceptance: a doc is considered "already accepted"
   * only when the stamped version matches the current LEGAL_METADATA
   * version. If the version bumps after acceptance, the next claim/
   * install surface treats it as not-yet-accepted and re-stamps.
   */
  tosVersionAccepted?: string;
  tosAcceptedAt?: string;
  privacyVersionAccepted?: string;
  privacyAcceptedAt?: string;
  dpaVersionAccepted?: string;
  dpaAcceptedAt?: string;
  debriefAddendumVersionAccepted?: string;
  debriefAddendumAcceptedAt?: string;
  propertyPulseAddendumVersionAccepted?: string;
  propertyPulseAddendumAcceptedAt?: string;
  // NOTE: stripeCustomerId is NOT stored on the Account. Each entitlement
  // (one per HubSpot portal) owns its own Stripe Customer because billing
  // is per-portal: an account with Debrief on portals A and B has two
  // distinct Customers. See Entitlement.stripeCustomerId. The reverse
  // index dunamis:stripe-customer-to-account:{customerId} resolves
  // customer → account for webhook joins.
}

export interface PublicAccount {
  accountId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Session {
  sessionId: string;
  accountId: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string;
  ip: string;
}

/**
 * Credit buckets on a Debrief entitlement.
 *
 * Spend order (enforced by the Debrief app, not this site):
 *   monthly first, then addon. Monthly is use-it-or-lose-it and resets
 *   when Stripe rolls the subscription period. Addon is cumulative and
 *   never expires, fed by credit-pack purchases and the first-month
 *   bonus on initial subscription.
 */
export interface CreditBuckets {
  monthly: number;
  monthlyAllotment: number;
  addon: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  firstMonthBonusGranted: boolean;
}

export interface Entitlement {
  entitlementId: string;
  accountId: string | null;
  product: Product;
  portalId: string;
  portalDomain: string;
  installerEmail: string;
  /**
   * HubSpot user id of the installer, captured by PP/Debrief server
   * at OAuth callback time from /oauth/v1/access-tokens/{token}.user_id
   * and stamped on the stub. Carried through to the claim-time
   * app_installed HubSpot event for attribution.
   *
   * Optional because stubs written before this field was introduced
   * won't have it; readers handle that case by either waiting for a
   * reinstall (the OAuth callback refreshes install-context fields) or
   * sending the event with the value absent.
   */
  hubspotUserId?: string | null;
  status: EntitlementStatus;
  tier: EntitlementTier | null;
  /** null only when the entitlement has never been activated. */
  credits: CreditBuckets | null;
  createdAt: string;
  renewalDate: string | null;
  stripeCustomerId: string | null;
  /** The current (most recent, possibly canceled) Stripe subscription id. */
  stripeSubscriptionId: string | null;
  /**
   * Every Stripe subscription id that has ever been associated with this
   * entitlement, oldest-first. stripeSubscriptionId mirrors the tail.
   * Immutable; canceling a subscription never removes it. Powers the
   * billing-history query so invoices from prior cancel/resubscribe
   * cycles don't disappear.
   */
  subscriptionHistory: string[];
  /** Set true when Stripe has scheduled cancellation at period end. */
  cancelAtPeriodEnd?: boolean;
  /**
   * One-time license state, Property Pulse only. Mirrors the HubSpot
   * `property_pulse_license_status` dropdown on the contact. Debrief
   * entitlements leave this undefined; subscription state lives on
   * `status` / `tier` / `stripeSubscriptionId`. Values match the
   * HubSpot option labels verbatim (see CLAUDE.md §15).
   */
  licenseStatus?: "None" | "Beta" | "Paid" | "Refunded";
  /** ISO timestamp of the PP one-time purchase. Unset pre-purchase. */
  purchasedAt?: string;
}

export function sumCredits(c: CreditBuckets | null): number {
  if (!c) return 0;
  return (c.monthly ?? 0) + (c.addon ?? 0);
}

export const PRODUCTS: Product[] = ["property-pulse", "debrief"];

/**
 * Catalog superset for marketing surfaces (the /products index, related
 * product cards on articles, header nav). Includes the entitlement
 * bearing Product union plus products that don't yet have entitlements
 * or billing. Keep Product narrow so pricing, claim, account dashboard,
 * and Stripe codepaths stay typed against the billable subset; widen
 * here only.
 */
export type ProductCatalogSlug =
  | Product
  | "carbon-copy"
  | "traverse-and-update"
  | "association-visualizer";

export type ProductStage = "beta" | "coming-soon" | "building" | "exploring";

export interface ProductMeta {
  slug: ProductCatalogSlug;
  name: string;
  tagline: string;
  description: string;
  stage: ProductStage;
  pricingModel: string;
  href: string;
  accentClass: string;
  /**
   * HubSpot marketplace listing URL. Optional because not every catalog
   * product has a marketplace listing yet (building/exploring stages
   * are pre-listing). Consumers must guard for absence before linking.
   */
  marketplaceUrl?: string;
}

/**
 * Full catalog in alphabetical order. Drives the /products index, the
 * admin related-products editor, and any "all products" surface.
 */
export const PRODUCT_CATALOG_SLUGS: ProductCatalogSlug[] = [
  "association-visualizer",
  "carbon-copy",
  "debrief",
  "property-pulse",
  "traverse-and-update",
];

export const PRODUCT_META: Record<ProductCatalogSlug, ProductMeta> = {
  "association-visualizer": {
    slug: "association-visualizer",
    name: "Association Visualizer",
    tagline: "See how every record connects, two hops out.",
    description:
      "An internal CRM card that renders a record's outbound associations as a two hop tree. Inline SVG thumbnail on the record, full size diagram with a clickable list of related records on click. Currently a private tool we're exploring as a public product.",
    stage: "exploring",
    pricingModel: "Internal tool",
    href: "/products/association-visualizer",
    accentClass: "text-[var(--fg-muted)]",
  },
  "carbon-copy": {
    slug: "carbon-copy",
    name: "Carbon Copy",
    tagline: "CC and BCC for HubSpot transactional emails.",
    description:
      "A workflow action that wraps HubSpot's Single-Send transactional email API and adds CC and BCC envelope support, including HubSpot personalization tokens and reply-to override. Built and deployed; marketplace listing is in progress.",
    stage: "building",
    pricingModel: "TBD",
    href: "/products/carbon-copy",
    accentClass: "text-[var(--fg-muted)]",
  },
  debrief: {
    slug: "debrief",
    name: "Debrief",
    tagline: "Handoff intelligence for HubSpot CRM.",
    description:
      "User-initiated AI handoff briefs. Open a record, click Draft Brief, review the structured brief and a personalized handoff message, then approve to atomically transfer ownership and log a Note. Briefs are generated when the user decides to hand off, not automatically when ownership changes.",
    stage: "coming-soon",
    pricingModel: "Subscription, 3 tiers",
    href: "/products/debrief",
    accentClass: "text-brief-500",
    marketplaceUrl: "https://ecosystem.hubspot.com/marketplace",
  },
  "property-pulse": {
    slug: "property-pulse",
    name: "Property Pulse",
    tagline: "Change history for every HubSpot record.",
    description:
      "A CRM card that shows the change history of admin-curated tracked properties on every record. Inline editing, filtering by date, source, user, and value, plus per-user CSV export. Live in marketplace review with capped installs.",
    stage: "beta",
    pricingModel: "$49 one-time per portal",
    href: "/products/property-pulse",
    accentClass: "text-pulse-500",
    marketplaceUrl: "https://ecosystem.hubspot.com/marketplace",
  },
  "traverse-and-update": {
    slug: "traverse-and-update",
    name: "Traverse and Update",
    tagline: "Update properties on records two hops away.",
    description:
      "A workflow action that updates any writable property on records exactly two outbound association hops away from the enrolled object. Optional association-label filters on each hop and a CRM Search prefilter to narrow the target set. Fully built; not yet on the marketplace.",
    stage: "building",
    pricingModel: "TBD",
    href: "/products/traverse-and-update",
    accentClass: "text-[var(--fg-muted)]",
  },
};

export function toPublicAccount(a: Account): PublicAccount {
  return {
    accountId: a.accountId,
    email: a.email,
    emailVerified: a.emailVerified,
    firstName: a.firstName,
    lastName: a.lastName,
    createdAt: a.createdAt,
  };
}
