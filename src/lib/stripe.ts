import Stripe from "stripe";

/**
 * Singleton Stripe client for the Dunamis Studios site. Pinned API
 * version: any upgrade must be deliberate so webhook payload shapes and
 * SDK return types don't silently drift.
 *
 * Server-only. Never import into client components — the secret key
 * must never ship in the browser bundle.
 */

const API_VERSION = "2026-03-25.dahlia" as const;

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Pull env from Vercel or add it to .env.local.",
    );
  }
  client = new Stripe(key, {
    apiVersion: API_VERSION,
    typescript: true,
    appInfo: {
      name: "dunamis-studios-web",
      url: "https://www.dunamisstudios.net",
    },
  });
  return client;
}

export function stripeMode(): "test" | "live" {
  return process.env.STRIPE_MODE === "live" ? "live" : "test";
}

export function publishableKey(): string {
  const k = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!k) {
    throw new Error(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured.",
    );
  }
  return k;
}
