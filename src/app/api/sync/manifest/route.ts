/**
 * GET/POST the per-customer-per-product encrypted manifest. The
 * server treats the manifest as opaque ciphertext on both ends: no
 * decryption, no parsing, no validation. Auth is Bearer-token-only
 * since the manifest is the densest Sync surface and admin/portal
 * flows never need to touch it directly.
 */
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { bearerCustomerId } from "@/lib/sync/auth";
import { getSyncCustomer } from "@/lib/sync/customer";
import {
  buildManifestKey,
  getStorage,
} from "@/lib/sync/storage";
import type { BlobMetadata } from "@/lib/sync/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/sync/manifest?product=atelier
 * POST /api/sync/manifest?product=atelier
 *
 * Round-trips the per-customer-per-product encrypted manifest. The
 * server never decrypts or inspects the manifest payload — it stores
 * and returns opaque bytes. Auth is Bearer-token-only; the manifest is
 * the densest Sync surface and admin / portal flows have no reason to
 * touch it directly.
 *
 * Body of POST is the raw encrypted bytes (not JSON), with metadata
 * carried in headers:
 *   X-Sync-Product           required
 *   X-Sync-Manifest-Version  monotonic int, increments on each write
 *   X-Sync-Updated-At        ISO 8601 client timestamp
 *   X-Sync-Content-Hash      sha256 hex of the ciphertext
 *   X-Sync-Key-Generation    integer, must match the customer's current generation
 */
export async function GET(request: Request) {
  const customerId = await bearerCustomerId(request);
  if (!customerId) return unauthorized();

  const product = pickProduct(request);
  if (!product) return invalidProduct();

  const customer = await mustHaveAccessibleCustomer(customerId);
  if (customer instanceof NextResponse) return customer;

  const key = buildManifestKey({ customerId, product });
  const fetched = await getStorage().getBlob(key);
  if (!fetched) {
    return apiError(404, "manifest_not_found", "No manifest exists yet.");
  }

  return new NextResponse(fetched.data as unknown as BodyInit, {
    status: 200,
    headers: serializeMetadataHeaders(fetched.metadata),
  });
}

export async function POST(request: Request) {
  const customerId = await bearerCustomerId(request);
  if (!customerId) return unauthorized();

  const product = pickProduct(request);
  if (!product) return invalidProduct();

  const customer = await mustHaveAccessibleCustomer(customerId);
  if (customer instanceof NextResponse) return customer;

  const headers = parseRequiredHeaders(request);
  if (headers instanceof NextResponse) return headers;

  if (headers.keyGeneration !== customer.current_key_generation) {
    return apiError(
      409,
      "stale_key_generation",
      "Manifest was encrypted with an obsolete key generation. Rotate complete? Refresh local key first.",
      { server_generation: String(customer.current_key_generation) },
    );
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0) {
    return apiError(400, "empty_body", "Manifest body is empty.");
  }

  const metadata: BlobMetadata = {
    customer_id: customerId,
    product,
    record_type: "manifest",
    record_id: "manifest",
    version: headers.version,
    updated_at: headers.updatedAt,
    deleted_at: null,
    content_hash: headers.contentHash,
    key_generation: headers.keyGeneration,
    server_updated_at: new Date().toISOString(),
  };

  const key = buildManifestKey({ customerId, product });
  await getStorage().putBlob(key, body, metadata);

  return NextResponse.json({ ok: true, version: headers.version });
}

function pickProduct(request: Request): string | null {
  const url = new URL(request.url);
  const product = url.searchParams.get("product")?.trim();
  if (!product) return null;
  // Conservative allowlist; widens as future host products opt into Sync.
  if (!/^[a-z0-9-]{1,32}$/.test(product)) return null;
  return product;
}

function invalidProduct(): NextResponse {
  return apiError(
    400,
    "invalid_product",
    "Query string must include product=<host-product-slug>.",
  );
}

function unauthorized(): NextResponse {
  return apiError(
    401,
    "unauthenticated",
    "Manifest requires a Bearer access token.",
  );
}

async function mustHaveAccessibleCustomer(
  customerId: string,
): Promise<
  | { customer_id: string; current_key_generation: number; sync_status: string }
  | NextResponse
> {
  const record = await getSyncCustomer(customerId);
  if (!record) {
    return apiError(
      404,
      "no_sync_customer",
      "No Sync customer record exists. Subscribe first.",
    );
  }
  if (record.sync_status === "expired") {
    return apiError(
      403,
      "subscription_expired",
      "Sync subscription has fully expired. Resubscribe to continue.",
    );
  }
  return record;
}

function parseRequiredHeaders(request: Request):
  | {
      version: number;
      updatedAt: string;
      contentHash: string;
      keyGeneration: number;
    }
  | NextResponse {
  const versionRaw = request.headers.get("x-sync-manifest-version");
  const updatedAt = request.headers.get("x-sync-updated-at") ?? "";
  const contentHash = request.headers.get("x-sync-content-hash") ?? "";
  const keyGenRaw = request.headers.get("x-sync-key-generation");

  const version = Number(versionRaw);
  const keyGeneration = Number(keyGenRaw);
  if (!Number.isInteger(version) || version < 1) {
    return apiError(400, "invalid_header", "x-sync-manifest-version is required.");
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
    "X-Sync-Manifest-Version": String(metadata.version),
    "X-Sync-Updated-At": metadata.updated_at,
    "X-Sync-Content-Hash": metadata.content_hash,
    "X-Sync-Key-Generation": String(metadata.key_generation),
    "X-Sync-Server-Updated-At": metadata.server_updated_at,
  };
}
