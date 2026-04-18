export type Product = "debrief" | "property-pulse";

export type EntitlementStatus = "trial" | "active" | "past_due" | "canceled";
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

export interface Entitlement {
  entitlementId: string;
  accountId: string | null;
  product: Product;
  portalId: string;
  portalDomain: string;
  installerEmail: string;
  status: EntitlementStatus;
  tier: EntitlementTier | null;
  credits: number | null;
  createdAt: string;
  renewalDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
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
    tagline: "Real-time deal health for HubSpot CRM",
    accentClass: "text-pulse-500",
    marketplaceUrl: "https://ecosystem.hubspot.com/marketplace",
  },
  debrief: {
    name: "Debrief",
    tagline: "AI-assisted call summaries inside HubSpot",
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
