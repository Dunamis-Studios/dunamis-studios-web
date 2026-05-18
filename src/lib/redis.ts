/**
 * Shared Upstash Redis client and the canonical KEY factory for every
 * Redis namespace the site reads or writes.
 *
 * Every key consumed by this codebase MUST flow through the KEY factory
 * here. That keeps the wire-level namespace single-sourced, makes
 * cross-app coupling explicit (Property Pulse and Debrief share this
 * instance under the `dunamis:*` prefix), and gives a grep target for
 * any future schema rename.
 *
 * The instance is lazy: redis() is a no-op until the first call, then
 * caches. Throws explicitly when the env vars are missing so a misconfig
 * fails at the first Redis access rather than silently returning null.
 *
 * Cross-app cohabitation rules: the dunamis:entitlement:* namespace is
 * shared with the Property Pulse and Debrief server repos and is the
 * canonical entitlement record. Renaming any of those keys requires a
 * coordinated PR across all three repos plus a data migration.
 */
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
  /**
   * Per-IP-hash current vote direction on a help article. Hash key is
   * `{ipHash}` and the value is "up" or "down" (HDEL on toggle-off).
   * This is the source of truth for "what did this visitor vote", so
   * the rating route can correctly adjust counters when a visitor
   * changes their vote. The legacy `kbRated` SET ignored direction
   * and so couldn't support up<>down toggling without double-counting.
   */
  kbVote: (articleKey: string) => `dunamis:kb:vote:${articleKey}`,
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
  /**
   * Email-course signup record. Keyed by course slug + sha256(email) so
   * re-submissions from the same visitor overwrite cleanly. Value is a
   * small JSON record holding the raw email, first name, ISO timestamp,
   * and source page. Source of truth for the signup; HubSpot Forms
   * mirror is best-effort on top, and HubSpot's workflow handles the
   * actual drip emails.
   */
  courseSignup: (courseSlug: string, emailHash: string) =>
    `dunamis:courses:signup:${courseSlug}:${emailHash}`,
  /**
   * Atelier launch-notification interest capture. Atelier is in active
   * development; submissions are launch-notification list entries, not
   * purchases. Each submission gets its own key (timestamp suffix), so
   * a visitor who submits twice generates two distinct records
   * instead of overwriting the prior one. This is NOT a Stripe
   * checkout intent or an entitlement record; Atelier is a Software
   * Projects prebuilt product and does not plug into the per-portal
   * entitlement machinery.
   *
   * Key name retains the `atelier-buy-request` segment since renaming
   * the production namespace mid-flight would orphan the existing
   * records — the namespace is internal and the semantics are
   * documented here.
   */
  atelierBuyRequest: (emailHash: string, ts: string) =>
    `dunamis:atelier-buy-request:${emailHash}:${ts}`,

  // -----------------------------------------------------------------
  // Atelier license issuance (Track 1A — admin license pipeline)
  // -----------------------------------------------------------------

  /**
   * Authoritative record for a single issued license. Keyed by the
   * license ID (lid) so lookups by lid are O(1). Value is a JSON
   * document carrying the license string, customer email, product,
   * version_major, tier, issued_at, status, and audit metadata.
   *
   * Status values: "active" | "refunded" | "revoked". Atelier has no
   * online revocation in v1 (the license string remains
   * cryptographically valid by design — see EULA §6.4), but recording
   * status here lets support workflows distinguish a refunded/revoked
   * license from an active one without re-verifying the signature.
   */
  atelierLicense: (lid: string) => `dunamis:atelier-license:${lid}`,

  /**
   * Idempotency record for /api/atelier/checkout webhook fulfillment.
   * Stores the lid that was minted for a given Stripe Checkout session
   * id, so a re-delivered checkout.session.completed event finds the
   * existing license and skips the mint+email side effects. Distinct
   * from the dunamis:stripe-event:* idempotency cache (which is keyed
   * by event_id) — Stripe occasionally generates new event_ids for the
   * same logical session, so we double-pin the de-dupe to session_id
   * to keep "one purchase = one license" intact.
   */
  atelierCheckoutSessionLid: (sessionId: string) =>
    `dunamis:atelier-checkout:${sessionId}:lid`,

  /**
   * Lookup index from email → set of lid values. One email may hold
   * multiple licenses (re-purchases, business-assigned-to-individual
   * scenarios), so this is a SET not a string. The lost-license
   * lookup endpoint reads this to find every license tied to a
   * customer's email; admins read it to triage support tickets.
   */
  atelierLicensesByEmail: (emailHash: string) =>
    `dunamis:atelier-licenses-by-email:${emailHash}`,

  /**
   * Lookup index from product → set of lid values. Lets the admin
   * licenses page filter by product without scanning every key in
   * the namespace. Currently only "atelier" is in use; the indirection
   * is forward-compatible with future prebuilt products that ship
   * through the same issuance pipeline.
   */
  atelierLicensesByProduct: (product: string) =>
    `dunamis:atelier-licenses-by-product:${product}`,

  /**
   * Lookup index from Dunamis account id → set of lid values. The
   * account_id binding is the canonical owner of a license once the
   * site purchase gate is in force; every license issued through
   * Stripe checkout, the admin issuance UI, or the CLI carries the
   * paying account's id. The customer portal at
   * /account/atelier-licenses queries this index instead of the email
   * index because email is mutable on the account record (a customer
   * who rotates their address shouldn't lose visibility of their
   * licenses) while account_id is stable.
   *
   * Pre-existing licenses that pre-date the account_id field carry
   * `account_id: null` until the backfill script
   * (scripts/backfill-license-account-id.ts) resolves them by email
   * and writes the index entry. The email index stays in place as a
   * fallback for the lost-license public lookup endpoint.
   */
  atelierLicensesByAccount: (accountId: string) =>
    `dunamis:atelier-licenses-by-account:${accountId}`,

  // -----------------------------------------------------------------
  // Atelier online activation (Online Activation Slice — Part 2)
  // -----------------------------------------------------------------

  /**
   * Authoritative record for a single device activation against a
   * license. Each record holds the license id, the three SHA-256
   * machine-id components (Windows GUID, motherboard serial, CPU id),
   * a customer-friendly device label, first-activated and
   * last-heartbeat timestamps, the running Atelier version, and
   * a status field ("active" | "deactivated").
   *
   * Up to 3 active activations may exist for any one license at a
   * time; deactivated activations remain in Redis for audit but
   * release their slot. The admin tools and customer portal both
   * read these records to render the per-license slot list.
   */
  atelierActivation: (activationId: string) =>
    `dunamis:atelier-activation:${activationId}`,

  /**
   * SET of activation_ids belonging to a license. Membership includes
   * both active and deactivated activations — slot-counting iterates
   * the set and filters on status. Activate, heartbeat, and
   * deactivate endpoints all read from this set; a license never
   * exists in the system without at least one activation slot
   * candidate, so the SET is the canonical "list every device that
   * has ever touched this license" lookup.
   */
  atelierActivationsByLicense: (lid: string) =>
    `dunamis:atelier-activations-by-license:${lid}`,

  // -----------------------------------------------------------------
   // Atelier EULA acceptance records (account-bound purchase slice)
  // -----------------------------------------------------------------

  /**
   * Server-side record that a specific Atelier license's owner
   * accepted a specific EULA version. Keyed by lid + eula_version so
   * a re-acceptance of a bumped EULA on the same license is a fresh
   * record alongside the prior one (audit-friendly: the admin
   * history modal renders every accept event for a license, not just
   * the most recent).
   *
   * Value shape (JSON):
   *   {
   *     lid: string,
   *     account_id: string,
   *     eula_version: string,
   *     accepted_at: string (ISO-8601 UTC, second precision),
   *     atelier_version: string,
   *     ip_at_accept: string | null,
   *     user_agent_at_accept: string | null,
   *   }
   *
   * No customer business data, no wedding data, no telemetry. Just
   * proof that the customer accepted the legal terms at a specific
   * moment from a specific install. Documented in atelier-docs/
   * privacy.md and atelier-docs/eula.md.
   */
  atelierEulaAcceptance: (lid: string, eulaVersion: string) =>
    `dunamis:atelier-eula-acceptance:${lid}:${eulaVersion}`,

  /**
   * SET of {eula_version} strings that have an acceptance record for
   * a given lid. The admin history modal walks this set to fetch
   * every record for a license (one Redis read per version) without
   * needing to scan the namespace.
   */
  atelierEulaAcceptancesByLicense: (lid: string) =>
    `dunamis:atelier-eula-acceptances-by-license:${lid}`,

  // -----------------------------------------------------------------
  // Admin action audit log (Admin Slice Part 6)
  // -----------------------------------------------------------------

  /**
   * Per-account audit log. Redis LIST, newest first via LPUSH. Every
   * read-write admin action against a customer writes one entry here,
   * regardless of success or failure. Retention is indefinite: the
   * audit trail must outlive the customer account, including the
   * "delete account" action's own final entry.
   *
   * Entry shape (JSON-stringified before LPUSH):
   *   {
   *     timestamp: string (ISO-8601 UTC, ms precision),
   *     admin_email: string,
   *     action: AdminActionName,
   *     parameters: Record<string, unknown>,
   *     result: "success" | "failure",
   *     error_message?: string,
   *   }
   *
   * Resource IDs in `parameters` reference whatever Redis key naturally
   * identifies the affected record (license -> lid, activation ->
   * activation_id, etc.), not user-facing shorthands like a machine
   * hash, so admin debugging traces back to the actual record.
   */
  adminActionLogByAccount: (accountId: string) =>
    `dunamis:admin-action-log:${accountId}`,

  /**
   * Global cross-account stream of admin actions, used by the
   * /admin dashboard's recent-activity feed. Redis STREAM capped to
   * the last 10K entries via MAXLEN ~ on every XADD. Each stream
   * entry's value is the per-account JSON entry plus an `account_id`
   * field so a single XREVRANGE call populates the feed without
   * per-entry lookups.
   */
  adminActionLogStream: "dunamis:admin-action-log:_all",

  /**
   * 5-minute admin-page cache of a customer's HubSpot tickets with
   * their identity_verification_reference values. Used by the
   * Verification Keys section on /admin/customers/[account_id] so a
   * repeat page view does not pay the HubSpot Search API round-trip
   * on every refresh. Value is JSON: the HubSpotTicketSummary[] the
   * tickets helper returns. The Refresh button on the page DELs this
   * key so the next render re-fetches from HubSpot.
   */
  adminVerificationKeyTickets: (accountId: string) =>
    `dunamis:admin-verification-key-tickets:${accountId}`,
} as const;
