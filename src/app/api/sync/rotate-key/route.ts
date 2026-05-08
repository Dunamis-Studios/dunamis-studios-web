import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { bearerCustomerId } from "@/lib/sync/auth";
import { upsertSyncCustomer } from "@/lib/sync/customer";
import { getSyncCustomer } from "@/lib/sync/customer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync/rotate-key
 *
 * Increment the customer's `current_key_generation`. After this call,
 * the server rejects any upload still encrypted with the prior
 * generation (writes return 409 stale_key_generation). The caller is
 * responsible for re-encrypting and re-uploading every record + the
 * manifest with the new key — the spec mandates this completes before
 * Atelier closes the rotation modal, so the server simply enforces the
 * generation check and lets the client drive the re-encrypt.
 *
 * No GETs are gated by key_generation: a previously-uploaded blob in
 * the prior generation can still be decrypted client-side because the
 * client retains both the old and new key for the duration of the
 * rotate flow. After rotation completes the client purges the old key
 * from Windows Credential Manager.
 */
export async function POST(request: Request) {
  const customerId = await bearerCustomerId(request);
  if (!customerId) {
    return apiError(
      401,
      "unauthenticated",
      "Key rotation requires a Bearer access token.",
    );
  }
  const customer = await getSyncCustomer(customerId);
  if (!customer || customer.sync_status === "expired") {
    return apiError(403, "subscription_inactive", "Sync is not active.");
  }
  const next = await upsertSyncCustomer(customerId, customer.email, (s) => ({
    ...s,
    current_key_generation: s.current_key_generation + 1,
  }));
  return NextResponse.json({
    ok: true,
    previous_generation: next.current_key_generation - 1,
    current_generation: next.current_key_generation,
  });
}
