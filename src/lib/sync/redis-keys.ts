/**
 * Sync-specific Redis key namespace. Distinct from the HubSpot
 * `dunamis:entitlement:*` family per CLAUDE.md §11.5 of
 * Software Projects/CLAUDE.md (the data-boundary carve-out).
 *
 * Kept in a separate module from the main `redis.ts` KEY map because:
 *   1. Sync was the first product line authorized to share the Dunamis
 *      Redis instance under a non-HubSpot namespace; future host-product
 *      additions would extend this file rather than the parent.
 *   2. The Sync namespace is not referenced by any non-Sync code path,
 *      so co-locating it here keeps the parent KEY map readable.
 */

export const SYNC_KEY = {
  /** Customer-state record. customer_id is the Stripe customer id. */
  customer: (customerId: string) => `dunamis:sync:customer:${customerId}`,

  /** Plaintext tombstone metadata for cron sweeping. 90-day TTL. */
  tombstone: (
    customerId: string,
    product: string,
    recordType: string,
    recordId: string,
  ) =>
    `dunamis:sync:tombstone:${customerId}:${product}:${recordType}:${recordId}`,

  /**
   * Index of customers in `trial_active` status. SET membership only.
   * Trial-expiry cron iterates this set rather than scanning every
   * customer record. Updated by the Stripe webhook on trial-month
   * checkout completion and on transition out of trial state.
   */
  trialActiveIndex: () => `dunamis:sync:index:trial-active`,

  /**
   * Index of customers in `cancelled_in_grace` status. Same shape as
   * trial-active index. Drives the daily grace-cleanup cron.
   */
  graceIndex: () => `dunamis:sync:index:cancelled-in-grace`,

  /**
   * One-time exchange code minted at Stripe checkout success. Atelier
   * deep-links to this code immediately after checkout and exchanges it
   * for a long-lived access token. TTL: 10 minutes. Single-use.
   */
  exchangeCode: (code: string) => `dunamis:sync:exchange:${code}`,

  /**
   * Lookup index from Stripe checkout session id → exchange code.
   * Written by the webhook on checkout completion; read by the post-
   * checkout marketing page (Phase 4) when rendering the deep link.
   * Same 10-minute TTL as the exchange code itself so they expire
   * together.
   */
  exchangeBySession: (sessionId: string) =>
    `dunamis:sync:exchange-by-session:${sessionId}`,

  /**
   * Stripe event idempotency lock for Sync events. Mirrors the existing
   * `KEY.stripeEvent` idempotency for non-Sync events; we use a separate
   * key so a duplicate Sync event id never collides with a duplicate
   * Debrief/Property-Pulse event id.
   */
  stripeEvent: (eventId: string) => `dunamis:sync:stripe-event:${eventId}`,

  /**
   * Per-customer activity log for status transitions. List capped at
   * the last 50 entries. Used by the customer portal to render a
   * "subscription history" panel and by support tooling to triage
   * reported state issues.
   */
  activityLog: (customerId: string) =>
    `dunamis:sync:activity-log:${customerId}`,

  /**
   * Reverse index: Dunamis account id → Stripe customer id. Populated
   * by the Sync webhook on first checkout completion and updated on
   * every subsequent state change. Used by session-cookie-authenticated
   * routes (checkout, portal, export, account-delete) to resolve the
   * signed-in account to its Sync customer record without scanning.
   * The forward direction (customer → account) is already provided by
   * the parent `KEY.stripeCustomerToAccount` index from the existing
   * Stripe billing infra.
   */
  accountToCustomer: (accountId: string) =>
    `dunamis:sync:account-to-customer:${accountId}`,
} as const;
