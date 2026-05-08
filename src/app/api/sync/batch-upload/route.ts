import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, parseJson } from "@/lib/api";
import { redis } from "@/lib/redis";
import { bearerCustomerId } from "@/lib/sync/auth";
import { getSyncCustomer } from "@/lib/sync/customer";
import { SYNC_KEY } from "@/lib/sync/redis-keys";
import { buildBlobKey, getStorage } from "@/lib/sync/storage";
import type { BlobMetadata } from "@/lib/sync/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync/batch-upload
 *
 * Outbox-flush optimization: a single round-trip uploads many blobs.
 * Used by Atelier and the PWA after returning from offline. The body
 * is JSON with each blob's ciphertext base64-encoded — chosen over a
 * multipart raw-byte format for client portability (mobile browsers
 * have inconsistent support for streaming multipart).
 *
 * Per-item failure isolation: a malformed entry returns a 200 with a
 * per-item result array, so a partial outbox flush still drains the
 * good entries. The client retries only the failed indices. Only fully
 * unauthenticated or fully malformed envelope produces a non-200.
 */

const itemSchema = z.object({
  product: z.string().regex(/^[a-z0-9-]{1,32}$/),
  record_type: z.string().regex(/^[a-z0-9_-]{1,40}$/),
  record_id: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
  version: z.number().int().min(1),
  updated_at: z.string().datetime(),
  content_hash: z.string().regex(/^[0-9a-f]{64}$/i),
  key_generation: z.number().int().min(1),
  /** Base64-encoded ciphertext. */
  data_b64: z.string().min(1).max(8 * 1024 * 1024),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(200),
});

export async function POST(request: Request) {
  const customerId = await bearerCustomerId(request);
  if (!customerId) {
    return apiError(
      401,
      "unauthenticated",
      "Batch upload requires a Bearer access token.",
    );
  }
  const customer = await getSyncCustomer(customerId);
  if (!customer || customer.sync_status === "expired") {
    return apiError(
      403,
      "subscription_inactive",
      "Sync subscription is not active.",
    );
  }

  const parsed = await parseJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const results: Array<
    | { ok: true; index: number; metadata: BlobMetadata }
    | { ok: false; index: number; code: string; message: string }
  > = [];

  for (let i = 0; i < parsed.data.items.length; i++) {
    const item = parsed.data.items[i];
    try {
      if (item.key_generation !== customer.current_key_generation) {
        results.push({
          ok: false,
          index: i,
          code: "stale_key_generation",
          message: `Item encrypted with key gen ${item.key_generation}, server is at ${customer.current_key_generation}.`,
        });
        continue;
      }
      const buf = Buffer.from(item.data_b64, "base64");
      if (buf.byteLength === 0) {
        results.push({
          ok: false,
          index: i,
          code: "empty_payload",
          message: "data_b64 decoded to zero bytes.",
        });
        continue;
      }
      const metadata: BlobMetadata = {
        customer_id: customerId,
        product: item.product,
        record_type: item.record_type,
        record_id: item.record_id,
        version: item.version,
        updated_at: item.updated_at,
        deleted_at: null,
        content_hash: item.content_hash,
        key_generation: item.key_generation,
        server_updated_at: new Date().toISOString(),
      };
      const key = buildBlobKey({
        customerId,
        product: item.product,
        recordType: item.record_type,
        recordId: item.record_id,
      });
      await getStorage().putBlob(key, new Uint8Array(buf), metadata);
      // Clear any tombstone the upload supersedes.
      await redis().del(
        SYNC_KEY.tombstone(
          customerId,
          item.product,
          item.record_type,
          item.record_id,
        ),
      );
      results.push({ ok: true, index: i, metadata });
    } catch (err) {
      console.error(`[sync-batch-upload] item ${i} failed:`, err);
      results.push({
        ok: false,
        index: i,
        code: "internal_error",
        message: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  return NextResponse.json({
    server_now: new Date().toISOString(),
    results,
  });
}
