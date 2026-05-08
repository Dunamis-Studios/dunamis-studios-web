/**
 * Shared types for the Dunamis Sync v1 server. All payload shapes that
 * cross the API boundary land here. Atelier (Rust) and the PWA
 * (TypeScript) consume these via the OpenAPI-shaped responses; the
 * server-side TypeScript references them directly.
 *
 * See Software Projects/atelier/docs/internal/dunamis-sync-v1-final-spec.md
 * for the canonical product spec these types model.
 */

/** Status of a customer's Sync subscription. Source-of-truth on the server. */
export type SyncStatus =
  | "none"
  | "trial_active"
  | "active"
  | "cancelled_in_grace"
  | "expired";

/** Subscription cadence (recurring SKUs only). Trial-month is one-time. */
export type SyncCadence = "monthly" | "annual";

/**
 * Customer-state record under `dunamis:sync:customer:{customer_id}`.
 *
 * `customer_id` here is the Stripe customer ID (`cus_…`). Stripe is the
 * join key — we do not duplicate identity data. Email and other
 * personally-identifying fields live on the existing Account record;
 * the link between Stripe customer and Account is already maintained by
 * `KEY.stripeCustomerToAccount` in the existing schema.
 */
export interface SyncCustomerState {
  customer_id: string;
  email: string;
  sync_status: SyncStatus;
  sync_trial_ends_at: string | null;
  sync_grace_ends_at: string | null;
  sync_subscription_id: string | null;
  sync_activated_at: string | null;
  sync_active_through: string | null;
  current_key_generation: number;
  paired_pwa_devices_count: number;
  first_sync_completed_at: string | null;
  last_status_change_at: string;
  /** Cron tracking — last time T-3 reminder fired, to avoid duplicate sends. */
  trial_t3_email_sent_at: string | null;
  /** Cron tracking — last time T-0 reminder fired. */
  trial_t0_email_sent_at: string | null;
}

/**
 * Metadata a host product sends on every blob upload. Server stores a
 * mirrored copy alongside the blob bytes so list-changes and conflict
 * detection don't have to fetch the full ciphertext.
 *
 * The server never decrypts the payload. content_hash is computed by
 * the client over the ciphertext, not the plaintext, so the server can
 * verify integrity without learning anything about the record.
 */
export interface BlobMetadata {
  customer_id: string;
  product: string;
  record_type: string;
  record_id: string;
  version: number;
  /** Client timestamp at write — drives conflict resolution (last-edit-wins). */
  updated_at: string;
  /** Tombstone marker. Set on DELETE; null on regular upload. */
  deleted_at: string | null;
  content_hash: string;
  /**
   * Key generation id. Increments on `Rotate sync key`; old generations
   * are rejected by the server so an attacker who captures an old QR
   * cannot write decryptable data after rotation.
   */
  key_generation: number;
  /** Server time the metadata row was last written. Distinct from updated_at. */
  server_updated_at: string;
}

/** Pagination/listing entry. Excludes the blob bytes themselves. */
export interface BlobListEntry {
  metadata: BlobMetadata;
  /** Storage-backend-specific path the bytes live at. Opaque to callers. */
  storage_key: string;
  /** Size of the ciphertext in bytes. Useful for client outbox planning. */
  size_bytes: number;
}

/**
 * Server-side tombstone index entry. Plaintext metadata only — never
 * the record content. Kept under a 90-day TTL so the customer's other
 * devices have a generous window to observe and replicate the deletion.
 *
 * Per spec §11 open item #1, this sidecar exists because the encrypted
 * manifest cannot be cron-swept server-side. The sweep operates on
 * these plaintext rows instead.
 */
export interface TombstoneIndexEntry {
  customer_id: string;
  product: string;
  record_type: string;
  record_id: string;
  deleted_at: string;
  key_generation: number;
}

/** Auth token payload — signed JWT carried as Bearer on Sync requests. */
export interface SyncTokenClaims {
  /** Stripe customer id this token authorizes. */
  cid: string;
  /** Token kind. "access" is long-lived; "qr" is the 5-min QR-pairing token. */
  kind: "access" | "qr";
  /** Numeric epoch, seconds. */
  iat: number;
  /** Numeric epoch, seconds. */
  exp: number;
}

/** Lookup keys for the three Sync Stripe SKUs. Code never references prices by ID. */
export const SYNC_LOOKUP_KEYS = {
  monthly: "dunamis_sync_monthly",
  annual: "dunamis_sync_annual",
  trial_month: "dunamis_sync_trial_month",
} as const;

export type SyncLookupKey = (typeof SYNC_LOOKUP_KEYS)[keyof typeof SYNC_LOOKUP_KEYS];
