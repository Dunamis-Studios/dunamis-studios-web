/**
 * Cursor-paginated delta read for Sync clients. Returns blob and
 * tombstone metadata for everything modified since the supplied
 * timestamp, capped by limit. Drives the catch-up scan a client
 * runs after coming online or pairing a new device.
 */
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { redis } from "@/lib/redis";
import { bearerCustomerId } from "@/lib/sync/auth";
import { getSyncCustomer } from "@/lib/sync/customer";
import { SYNC_KEY } from "@/lib/sync/redis-keys";
import {
  buildCustomerPrefix,
  getStorage,
} from "@/lib/sync/storage";
import type { BlobListEntry, TombstoneIndexEntry } from "@/lib/sync/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/sync/list-changes?product=atelier&since=2026-05-01T...&limit=500
 *
 * Returns metadata for every blob (and tombstone) under this customer
 * + product whose `server_updated_at` is later than the `since` cursor.
 * No payload bytes — this is the diff-driver for incremental sync.
 *
 * `since` may be omitted, in which case the response includes the full
 * customer set under the given product (initial sync path).
 */
export async function GET(request: Request) {
  const customerId = await bearerCustomerId(request);
  if (!customerId) {
    return apiError(
      401,
      "unauthenticated",
      "list-changes requires a Bearer access token.",
    );
  }
  const customer = await getSyncCustomer(customerId);
  if (!customer || customer.sync_status === "expired") {
    return apiError(403, "subscription_inactive", "Sync is not active.");
  }

  const url = new URL(request.url);
  const product = url.searchParams.get("product")?.trim();
  if (!product || !/^[a-z0-9-]{1,32}$/.test(product)) {
    return apiError(400, "invalid_product", "product is required.");
  }
  const sinceRaw = url.searchParams.get("since");
  const since = sinceRaw ? Date.parse(sinceRaw) : 0;
  if (sinceRaw && Number.isNaN(since)) {
    return apiError(400, "invalid_since", "since must be ISO 8601.");
  }
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Math.max(1, Math.min(2000, Number(limitRaw))) : 500;

  // Walk the storage backend filtered to this customer's product.
  const prefix = `${buildCustomerPrefix(customerId)}${product}/`;
  const blobs = await getStorage().listBlobs(prefix);
  const blobChanges = blobs
    .filter((b) => Date.parse(b.metadata.server_updated_at) > since)
    .map(toChangeEntry)
    .sort((a, b) =>
      a.server_updated_at.localeCompare(b.server_updated_at),
    )
    .slice(0, limit);

  // Walk the tombstone-index for this (customer, product) pair.
  // Note: SCAN against MATCH would be cheaper than KEYS for huge
  // tenants, but the data shape is per-customer-bounded so KEYS is
  // safe here.
  const tombKeyPattern =
    SYNC_KEY.tombstone(customerId, product, "*", "*").replace(":*:*", ":*");
  const tombKeys = await scanKeys(tombKeyPattern);
  const tombs: TombstoneIndexEntry[] = [];
  for (const k of tombKeys) {
    const entry = await redis().get<TombstoneIndexEntry>(k);
    if (!entry) continue;
    if (Date.parse(entry.deleted_at) > since) tombs.push(entry);
  }

  return NextResponse.json({
    product,
    since: sinceRaw ?? null,
    server_now: new Date().toISOString(),
    changes: blobChanges,
    tombstones: tombs.slice(0, limit),
  });
}

function toChangeEntry(entry: BlobListEntry) {
  return {
    record_type: entry.metadata.record_type,
    record_id: entry.metadata.record_id,
    version: entry.metadata.version,
    updated_at: entry.metadata.updated_at,
    server_updated_at: entry.metadata.server_updated_at,
    content_hash: entry.metadata.content_hash,
    key_generation: entry.metadata.key_generation,
    size_bytes: entry.size_bytes,
  };
}

/**
 * Bounded SCAN wrapper. Upstash's REST client returns tuples of
 * [cursor, keys] from `scan`; we iterate until cursor is "0". The
 * caller's pattern includes the customer id, so the keyspace walked
 * is bounded by that customer's tombstone count (typically small).
 */
async function scanKeys(pattern: string): Promise<string[]> {
  const r = redis();
  const out: string[] = [];
  let cursor: string = "0";
  let firstPage = true;
  for (let pages = 0; pages < 100; pages++) {
    if (!firstPage && cursor === "0") break;
    firstPage = false;
    const result = (await r.scan(cursor === "0" ? 0 : cursor, {
      match: pattern,
      count: 200,
    })) as [string, string[]];
    const [next, batch] = result;
    out.push(...batch);
    cursor = next;
  }
  return out;
}
