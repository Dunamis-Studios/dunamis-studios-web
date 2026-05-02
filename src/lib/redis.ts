import { Redis } from "@upstash/redis";

/**
 * Shared Upstash Redis client. In Vercel, Upstash auto-populates
 * KV_REST_API_URL and KV_REST_API_TOKEN when the integration is linked.
 * Keys are namespaced `dunamis:*` to avoid collision with Property Pulse
 * and Debrief data that share the same KV instance.
 */
let client: Redis | null = null;

export function redis(): Redis {
  if (client) return client;

  const url = process.env.KV_REST_API_URL ?? process.env.REDIS_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Redis env vars missing. Set KV_REST_API_URL and KV_REST_API_TOKEN " +
        "(auto-populated by the Upstash integration in Vercel).",
    );
  }

  client = new Redis({ url, token });
  return client;
}

export const KEY = {
  account: (id: string) => `dunamis:account:${id}`,
  emailIndex: (email: string) =>
    `dunamis:email-to-account:${email.toLowerCase()}`,
  session: (id: string) => `dunamis:session:${id}`,
  accountSessions: (accountId: string) =>
    `dunamis:account-sessions:${accountId}`,
  verifyEmail: (token: string) => `dunamis:verify-email:${token}`,
  resetPassword: (token: string) => `dunamis:reset-password:${token}`,
  entitlement: (product: string, portalId: string) =>
    `dunamis:entitlement:${product}:${portalId}`,
  accountEntitlements: (accountId: string) =>
    `dunamis:account-entitlements:${accountId}`,
  rate: (bucket: string, key: string) => `dunamis:rate:${bucket}:${key}`,
  stripeCustomerToAccount: (customerId: string) =>
    `dunamis:stripe-customer-to-account:${customerId}`,
  stripeEvent: (eventId: string) => `dunamis:stripe-event:${eventId}`,
  tierOverride: (product: string, portalId: string) =>
    `dunamis:tier-override:${product}:${portalId}`,
  /** Short-TTL lock used to serialize webhook writes per entitlement. */
  entitlementLock: (product: string, portalId: string) =>
    `dunamis:lock:entitlement:${product}:${portalId}`,
  // --- Help center (KB) ---
  // The `articleKey` callers pass is composed as "{category}:{slug}"
  // so same-slug-different-category articles don't collide. See
  // src/lib/kb-rating.ts and src/lib/kb-feedback.ts for the helpers
  // that build it.
  kbRating: (articleKey: string) => `dunamis:kb:rating:${articleKey}`,
  kbRated: (articleKey: string) => `dunamis:kb:rated:${articleKey}`,
  kbFeedback: (articleKey: string) => `dunamis:kb:feedback:${articleKey}`,
  // --- Guides & Articles ---
  guide: (slug: string) => `dunamis:guide:${slug}`,
  article: (slug: string) => `dunamis:article:${slug}`,
  guidesIndex: "dunamis:guides:index",
  articlesIndex: "dunamis:articles:index",
  image: (id: string) => `dunamis:image:${id}`,
  /**
   * Notify-on-launch signups for unshipped products. The key uses an
   * SHA-256 hash of the lowercased email so storage is dedup-safe per
   * (product, email) pair without persisting the raw address in the key
   * namespace. The value is a small JSON record holding the raw email,
   * an ISO timestamp, and the source slug; admin tooling that drains
   * the list resolves the raw email from the value, not the key.
   */
  notifySignup: (productSlug: string, emailHash: string) =>
    `dunamis:notify:${productSlug}:${emailHash}`,
  /**
   * Free-tool report submissions (e.g., the handoff time calculator).
   * Keyed by tool slug + sha256(email) so re-submissions from the same
   * visitor overwrite cleanly. Value is a JSON record holding the raw
   * email, the inputs the visitor filled in, the computed results, and
   * an ISO timestamp. Source of truth for the lead capture; HubSpot
   * Forms mirror is best-effort on top.
   */
  toolReport: (toolSlug: string, emailHash: string) =>
    `dunamis:tools:${toolSlug}:${emailHash}`,
} as const;
