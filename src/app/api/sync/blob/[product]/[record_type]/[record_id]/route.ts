import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { redis } from "@/lib/redis";
import { bearerCustomerId } from "@/lib/sync/auth";
import { getSyncCustomer } from "@/lib/sync/customer";
import { SYNC_KEY } from "@/lib/sync/redis-keys";
import { buildBlobKey, getStorage } from "@/lib/sync/storage";
import type { BlobMetadata, TombstoneIndexEntry } from "@/lib/sync/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/sync/blob/{product}/{record_type}/{record_id}
 *
 * Single-blob CRUD. Auth is Bearer-only.
 *
 * - GET    download ciphertext + metadata headers
 * - PUT    upload ciphertext, metadata in X-Sync-* headers (raw body, not JSON)
 * - DELETE soft-delete: writes a server-side tombstone-index row with
 *          90-day TTL and removes the blob bytes. The encrypted
 *          manifest's tombstone entry is the client's responsibility
 *          on the next manifest sync.
 *
 * Conflict detection: PUT with `If-Match: <version>` requires the
 * stored version to equal the supplied number. Mismatch returns 409
 * with the server's current metadata so the client can run the last-
 * edit-wins resolution path.
 */

const TOMBSTONE_TTL_SEC = 90 * 24 * 60 * 60;

interface RouteContext {
  params: Promise<{ product: string; record_type: string; record_id: string }>;
}

export async function GET(request: Request, ctx: RouteContext) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const params = await ctx.params;
  const validation = validateParams(params);
  if (validation instanceof NextResponse) return validation;

  const key = buildBlobKey({
    customerId: auth.customerId,
    product: validation.product,
    recordType: validation.record_type,
    recordId: validation.record_id,
  });
  const fetched = await getStorage().getBlob(key);
  if (!fetched) {
    return apiError(404, "not_found", "Blob does not exist.");
  }
  return new NextResponse(fetched.data as unknown as BodyInit, {
    status: 200,
    headers: serializeMetadataHeaders(fetched.metadata),
  });
}

export async function PUT(request: Request, ctx: RouteContext) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const params = await ctx.params;
  const validation = validateParams(params);
  if (validation instanceof NextResponse) return validation;

  const customer = await getSyncCustomer(auth.customerId);
  if (!customer || customer.sync_status === "expired") {
    return apiError(
      403,
      "subscription_inactive",
      "Sync subscription is not active. Resubscribe to continue uploading.",
    );
  }

  const headers = parsePutHeaders(request);
  if (headers instanceof NextResponse) return headers;

  if (headers.keyGeneration !== customer.current_key_generation) {
    return apiError(
      409,
      "stale_key_generation",
      "Blob was encrypted with an obsolete key generation. Re-encrypt with the current key first.",
      { server_generation: String(customer.current_key_generation) },
    );
  }

  const key = buildBlobKey({
    customerId: auth.customerId,
    product: validation.product,
    recordType: validation.record_type,
    recordId: validation.record_id,
  });

  // If-Match conflict check.
  const ifMatchRaw = request.headers.get("if-match");
  if (ifMatchRaw !== null) {
    const ifMatch = Number(ifMatchRaw);
    const existing = await getStorage().getBlob(key);
    if (existing && existing.metadata.version !== ifMatch) {
      return NextResponse.json(
        {
          error: {
            code: "version_conflict",
            message: "Server has a newer version of this record.",
            server_metadata: existing.metadata,
          },
        },
        { status: 409 },
      );
    }
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0) {
    return apiError(400, "empty_body", "Blob body is empty.");
  }

  const metadata: BlobMetadata = {
    customer_id: auth.customerId,
    product: validation.product,
    record_type: validation.record_type,
    record_id: validation.record_id,
    version: headers.version,
    updated_at: headers.updatedAt,
    deleted_at: null,
    content_hash: headers.contentHash,
    key_generation: headers.keyGeneration,
    server_updated_at: new Date().toISOString(),
  };

  await getStorage().putBlob(key, body, metadata);

  // Clear any tombstone row that may exist from a prior delete — an
  // upload after delete is a "resurrect," and the cron-sweep target is
  // gone for that record.
  await redis().del(
    SYNC_KEY.tombstone(
      auth.customerId,
      validation.product,
      validation.record_type,
      validation.record_id,
    ),
  );

  return NextResponse.json({ ok: true, metadata });
}

export async function DELETE(request: Request, ctx: RouteContext) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return auth;
  const params = await ctx.params;
  const validation = validateParams(params);
  if (validation instanceof NextResponse) return validation;

  const customer = await getSyncCustomer(auth.customerId);
  if (!customer || customer.sync_status === "expired") {
    return apiError(
      403,
      "subscription_inactive",
      "Sync subscription is not active.",
    );
  }

  const key = buildBlobKey({
    customerId: auth.customerId,
    product: validation.product,
    recordType: validation.record_type,
    recordId: validation.record_id,
  });

  await getStorage().deleteBlob(key);

  const tombstone: TombstoneIndexEntry = {
    customer_id: auth.customerId,
    product: validation.product,
    record_type: validation.record_type,
    record_id: validation.record_id,
    deleted_at: new Date().toISOString(),
    key_generation: customer.current_key_generation,
  };
  await redis().set(
    SYNC_KEY.tombstone(
      auth.customerId,
      validation.product,
      validation.record_type,
      validation.record_id,
    ),
    tombstone,
    { ex: TOMBSTONE_TTL_SEC },
  );

  return NextResponse.json({ ok: true, tombstone });
}

async function authenticate(
  request: Request,
): Promise<{ customerId: string } | NextResponse> {
  const customerId = await bearerCustomerId(request);
  if (!customerId) {
    return apiError(
      401,
      "unauthenticated",
      "Blob endpoints require a Bearer access token.",
    );
  }
  return { customerId };
}

function validateParams(params: {
  product: string;
  record_type: string;
  record_id: string;
}):
  | { product: string; record_type: string; record_id: string }
  | NextResponse {
  const { product, record_type, record_id } = params;
  if (!/^[a-z0-9-]{1,32}$/.test(product)) {
    return apiError(400, "invalid_product", "product is invalid.");
  }
  if (!/^[a-z0-9_-]{1,40}$/.test(record_type)) {
    return apiError(400, "invalid_record_type", "record_type is invalid.");
  }
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(record_id)) {
    return apiError(400, "invalid_record_id", "record_id is invalid.");
  }
  return { product, record_type, record_id };
}

function parsePutHeaders(request: Request):
  | {
      version: number;
      updatedAt: string;
      contentHash: string;
      keyGeneration: number;
    }
  | NextResponse {
  const versionRaw = request.headers.get("x-sync-version");
  const updatedAt = request.headers.get("x-sync-updated-at") ?? "";
  const contentHash = request.headers.get("x-sync-content-hash") ?? "";
  const keyGenRaw = request.headers.get("x-sync-key-generation");

  const version = Number(versionRaw);
  const keyGeneration = Number(keyGenRaw);
  if (!Number.isInteger(version) || version < 1) {
    return apiError(400, "invalid_header", "x-sync-version is required.");
  }
  if (!Number.isInteger(keyGeneration) || keyGeneration < 1) {
    return apiError(400, "invalid_header", "x-sync-key-generation is required.");
  }
  if (!updatedAt || Number.isNaN(Date.parse(updatedAt))) {
    return apiError(400, "invalid_header", "x-sync-updated-at must be ISO 8601.");
  }
  if (!/^[0-9a-f]{64}$/i.test(contentHash)) {
    return apiError(400, "invalid_header", "x-sync-content-hash must be sha256 hex.");
  }
  return { version, updatedAt, contentHash, keyGeneration };
}

function serializeMetadataHeaders(metadata: BlobMetadata): HeadersInit {
  return {
    "Content-Type": "application/octet-stream",
    "Cache-Control": "no-store",
    "X-Sync-Version": String(metadata.version),
    "X-Sync-Updated-At": metadata.updated_at,
    "X-Sync-Content-Hash": metadata.content_hash,
    "X-Sync-Key-Generation": String(metadata.key_generation),
    "X-Sync-Server-Updated-At": metadata.server_updated_at,
    ...(metadata.deleted_at
      ? { "X-Sync-Deleted-At": metadata.deleted_at }
      : {}),
  };
}
