import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { bearerCustomerId } from "@/lib/sync/auth";
import {
  getCustomerIdForAccount,
  getSyncCustomer,
} from "@/lib/sync/customer";
import {
  buildCustomerPrefix,
  buildManifestKey,
  getStorage,
} from "@/lib/sync/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync/export
 *
 * Returns a JSON manifest of every blob the customer has stored. Each
 * entry includes its storage key, server metadata, and a base64-encoded
 * copy of the still-encrypted ciphertext. The customer decrypts
 * client-side using the AES key in their keychain.
 *
 * This is the user-facing data-export commitment in the Privacy Policy
 * draft — even with zero-knowledge encryption, the customer must be
 * able to walk away with everything we hold for them.
 *
 * Authenticates via either Bearer token or session cookie. The export
 * is read-only and does not flip any state.
 */
export async function POST(request: Request) {
  const customerId = await resolveCustomerId(request);
  if (!customerId) {
    return apiError(401, "unauthenticated", "Export requires authentication.");
  }
  const record = await getSyncCustomer(customerId);
  if (!record) {
    return apiError(
      404,
      "no_sync_customer",
      "No Sync subscription on file for this customer.",
    );
  }

  const storage = getStorage();
  const blobs = await storage.listBlobs(buildCustomerPrefix(customerId));

  // Inline ciphertext as base64. For a small customer the response is
  // sub-megabyte. A future slice may cap response size and paginate or
  // stream a zip; v1 is the simplest possible export.
  const items = await Promise.all(
    blobs.map(async (entry) => {
      const fetched = await storage.getBlob(entry.storage_key);
      if (!fetched) return null;
      return {
        storage_key: entry.storage_key,
        metadata: fetched.metadata,
        ciphertext_b64: Buffer.from(fetched.data).toString("base64"),
      };
    }),
  );

  return NextResponse.json({
    customer_id: customerId,
    exported_at: new Date().toISOString(),
    sync_status: record.sync_status,
    current_key_generation: record.current_key_generation,
    note: "Ciphertext is AES-GCM encrypted. Decrypt with the key from your Windows Credential Manager (Atelier) or IndexedDB (PWA).",
    items: items.filter((x): x is NonNullable<typeof x> => x !== null),
    /**
     * Convenience pointer to where the manifest lives among the items
     * above, so a consumer doesn't have to reconstruct the path.
     */
    manifest_storage_key: buildManifestKey({
      customerId,
      product: "atelier",
    }),
  });
}

async function resolveCustomerId(request: Request): Promise<string | null> {
  const fromBearer = await bearerCustomerId(request);
  if (fromBearer) return fromBearer;
  const session = await getCurrentSession();
  if (!session) return null;
  return getCustomerIdForAccount(session.account.accountId);
}
