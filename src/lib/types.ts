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
  // NOTE: stripeCustomerId is NOT stored on the Account. Each entitlement
  // (one per HubSpot portal) owns its own Stripe Customer because billing
  // is per-portal — an account with Debrief on portals A and B has two
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
 *   never expires — fed by credit-pack purchases and the first-month
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
   * HubSpot user id of the installer — captured by PP/Debrief server
   * at OAuth callback time from /oauth/v1/access-tokens/{token}.user_id
   * and stamped on the stub. Carried through to the claim-time
   * app_installed HubSpot event.
   *
   * Optional because stubs written before this field was introduced
   * won't have it; readers handle that case by either waiting for a
   * reinstall (the OAuth callback refreshes install-context fields) or
   * sending the event with the value absent.
   */
  hubspotUserId?: string | null;
  /**
   * OAuth scopes the installer granted — captured at OAuth callback
   * time from /oauth/v1/access-tokens/{token}.scopes. Refreshed on
   * reinstall if the user re-consents with a different scope set.
   * Same legacy-optional treatment as hubspotUserId.
   */
  scopesGranted?: string[];
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
   * Immutable — canceling a subscription never removes it. Powers the
   * billing-history query so invoices from prior cancel/resubscribe
   * cycles don't disappear.
   */
  subscriptionHistory: string[];
  /** Set true when Stripe has scheduled cancellation at period end. */
  cancelAtPeriodEnd?: boolean;
}

export function sumCredits(c: CreditBuckets | null): number {
  if (!c) return 0;
  return (c.monthly ?? 0) + (c.addon ?? 0);
}

export const PRODUCTS: Product[] = ["property-pulse", "debrief"];

export const PRODUCT_META: Record<
  Product,
  {
    name: string;
    tagline: string;
    accentClass: string;
    marketplaceUrl: string;
  }
> = {
  "property-pulse": {
    name: "Property Pulse",
    tagline: "Change history for every HubSpot record",
    accentClass: "text-pulse-500",
    marketplaceUrl: "https://ecosystem.hubspot.com/marketplace",
  },
  debrief: {
    name: "Debrief",
    tagline: "Handoff intelligence for HubSpot CRM",
    accentClass: "text-brief-500",
    marketplaceUrl: "https://ecosystem.hubspot.com/marketplace",
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
