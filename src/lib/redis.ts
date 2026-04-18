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
} as const;
