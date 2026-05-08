import type { BlobListEntry, BlobMetadata } from "../types";

/**
 * Storage-backend interface. Phase 1 ships with VercelBlobStorage;
 * R2Storage (Cloudflare R2) is the planned future implementation per
 * spec §11.8. Routes import this interface, never the concrete class,
 * so the storage backend can be swapped via getStorage() without
 * touching call sites.
 *
 * All methods deal in opaque ciphertext. The interface never sees
 * plaintext — encryption happens client-side in Atelier or the PWA.
 */
export interface SyncStorage {
  /** Read a blob by its full storage key (`{customer}/{product}/...`). */
  getBlob(
    key: string,
  ): Promise<{ data: Uint8Array; metadata: BlobMetadata } | null>;

  /** Upload a blob, replacing any existing object at the same key. */
  putBlob(
    key: string,
    data: Uint8Array,
    metadata: BlobMetadata,
  ): Promise<void>;

  /** Delete a blob. Idempotent — a missing object is treated as success. */
  deleteBlob(key: string): Promise<void>;

  /**
   * List blobs whose key starts with the given prefix. Used to
   * enumerate a customer's full sync set (cleanup paths) and by the
   * /list-changes endpoint when a client passes since=epoch-zero.
   */
  listBlobs(prefix: string): Promise<BlobListEntry[]>;
}

/**
 * Storage-key construction. The format is part of the public contract
 * with host clients (their PUT/GET/DELETE URLs derive from it), so this
 * helper is the single source of truth.
 *
 * Format:  {customer_id}/{product}/{record_type}/{record_id}.enc
 */
export function buildBlobKey(args: {
  customerId: string;
  product: string;
  recordType: string;
  recordId: string;
}): string {
  return `${args.customerId}/${args.product}/${args.recordType}/${args.recordId}.enc`;
}

/** Customer-scoped manifest key. One manifest per (customer, product). */
export function buildManifestKey(args: {
  customerId: string;
  product: string;
}): string {
  return `${args.customerId}/${args.product}/manifest.enc`;
}

/** Customer-scoped prefix for enumeration / cleanup. */
export function buildCustomerPrefix(customerId: string): string {
  return `${customerId}/`;
}
