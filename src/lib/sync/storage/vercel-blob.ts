import {
  del as vercelBlobDel,
  head as vercelBlobHead,
  list as vercelBlobList,
  put as vercelBlobPut,
} from "@vercel/blob";

import type { BlobListEntry, BlobMetadata } from "../types";
import type { SyncStorage } from "./types";

/**
 * Vercel Blob Storage implementation of SyncStorage. v1 backend.
 *
 * Implementation notes:
 *   - `addRandomSuffix: false` is required so a PUT to the same key
 *     overwrites in place rather than producing a sibling object.
 *     Without this flag, a re-upload would orphan the prior blob and
 *     break the storage-key-is-stable contract that drives client
 *     diffing.
 *   - `access: "public"` is the only mode the SDK supports as of v2.x;
 *     the actual access control happens at the API-route layer (Bearer
 *     token verification + customer-id ownership check). The blob URLs
 *     themselves carry an unguessable random component, but the
 *     ciphertext is the real defense — even with the URL, the blob is
 *     opaque without the customer's AES key.
 *   - Metadata travels alongside the blob via `addRandomSuffix: false`
 *     plus a custom contentType. Vercel Blob does not surface arbitrary
 *     metadata on GET, so we encode it as a JSON line prefix on the
 *     ciphertext payload (see putBlob) and parse it on getBlob. The
 *     prefix is small (~250 bytes for typical metadata) and lets us keep
 *     the storage interface backend-agnostic.
 */
export class VercelBlobStorage implements SyncStorage {
  async getBlob(
    key: string,
  ): Promise<{ data: Uint8Array; metadata: BlobMetadata } | null> {
    const exists = await this.head(key);
    if (!exists) return null;

    // Private blob stores return 403 on a bare fetch — the URL is real
    // but requires the read-write token in the Authorization header.
    // Public stores would also accept this header, so the branch is
    // unconditional.
    const token = process.env.BLOB_READ_WRITE_TOKEN ?? "";
    const res = await fetch(exists.url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return parseBlobPayload(new Uint8Array(buf));
  }

  async putBlob(
    key: string,
    data: Uint8Array,
    metadata: BlobMetadata,
  ): Promise<void> {
    const payload = encodeBlobPayload(data, metadata);
    // - access: "private" matches the store's configured access mode; "public"
    //   produces a "Cannot use public access on a private store" error.
    // - allowOverwrite: true is required for re-uploads (same record, new
    //   version) — the default rejects matching paths.
    // - Buffer wrap because Vercel Blob's PutBody type doesn't include
    //   Uint8Array directly on the Node-side path.
    await vercelBlobPut(key, Buffer.from(payload), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/octet-stream",
      cacheControlMaxAge: 0,
    });
  }

  async deleteBlob(key: string): Promise<void> {
    const exists = await this.head(key);
    if (!exists) return;
    await vercelBlobDel(exists.url);
  }

  async listBlobs(prefix: string): Promise<BlobListEntry[]> {
    const out: BlobListEntry[] = [];
    let cursor: string | undefined;
    for (let pages = 0; pages < 100; pages++) {
      const page = await vercelBlobList({ prefix, cursor, limit: 1000 });
      for (const blob of page.blobs) {
        const fetched = await this.getBlob(blob.pathname);
        if (!fetched) continue;
        out.push({
          metadata: fetched.metadata,
          storage_key: blob.pathname,
          size_bytes: blob.size,
        });
      }
      if (!page.cursor) break;
      cursor = page.cursor;
    }
    return out;
  }

  private async head(
    key: string,
  ): Promise<{ url: string; size: number } | null> {
    try {
      const h = await vercelBlobHead(key);
      return { url: h.url, size: h.size };
    } catch (err) {
      // Vercel Blob raises a BlobNotFoundError class with a message like
      // "Vercel Blob: The requested blob does not exist". Earlier
      // iterations matched on a regex that missed the "does not exist"
      // wording. Match the class name (more durable across SDK
      // wording changes) plus the message variants we've seen.
      if (err && (err as { name?: string }).name === "BlobNotFoundError") {
        return null;
      }
      if (err instanceof Error && /not.exist|not.found|404/i.test(err.message)) {
        return null;
      }
      throw err;
    }
  }
}

/**
 * Wire format: 4-byte big-endian metadata length || metadata JSON ||
 * ciphertext. This shape is host-storage-agnostic — the same payload
 * round-trips through any SyncStorage implementation without metadata
 * loss.
 */
function encodeBlobPayload(data: Uint8Array, metadata: BlobMetadata): Uint8Array {
  const json = new TextEncoder().encode(JSON.stringify(metadata));
  const len = json.byteLength;
  const out = new Uint8Array(4 + len + data.byteLength);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, len, false);
  out.set(json, 4);
  out.set(data, 4 + len);
  return out;
}

function parseBlobPayload(
  bytes: Uint8Array,
): { data: Uint8Array; metadata: BlobMetadata } | null {
  if (bytes.byteLength < 4) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = dv.getUint32(0, false);
  if (len <= 0 || 4 + len > bytes.byteLength) return null;
  const jsonBytes = bytes.subarray(4, 4 + len);
  let metadata: BlobMetadata;
  try {
    metadata = JSON.parse(new TextDecoder().decode(jsonBytes)) as BlobMetadata;
  } catch {
    return null;
  }
  const data = bytes.subarray(4 + len);
  return { data, metadata };
}
