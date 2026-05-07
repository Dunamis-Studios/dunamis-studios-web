import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getLicense,
  parseLicenseId,
} from "@/lib/atelier-license-signing";
import {
  MAX_ACTIVATIONS_PER_LICENSE,
  createActivation,
  getActivationsForLicense,
  matchesMachine,
  refreshActivationHeartbeat,
} from "@/lib/atelier-activation";

/**
 * POST /api/atelier/activate
 *
 * Called by the Atelier client during License Entry to bind a paid
 * license to a specific device. The 2-of-3 component matching rule in
 * matchesMachine() refreshes an existing slot when the same machine
 * re-activates after a hardware swap, so a customer who replaces a
 * motherboard or CPU does not consume a new slot.
 *
 * Authentication is "byte-for-byte equality of the license string
 * against the canonical key_string in Redis." The Rust client
 * already verifies the Ed25519 signature locally before calling this
 * endpoint, so the server-side check is defense-in-depth — a
 * tampered license_string fails the equality check and the request
 * cannot inherit any activation slot.
 *
 * Response shapes:
 *   200 ok:true with { activation_id, slot_count, max_slots,
 *                      first_activation } on success
 *   200 ok:false with { error: "slot_full", active_devices: [...] }
 *     when all 3 slots are taken by other machines (UI shows the
 *     inline "deactivate this one" picker)
 *   404 ok:false with { error: "license_not_found" } for unknown or
 *     tampered license strings
 *   410 ok:false with { error: "license_refunded" }
 *   410 ok:false with { error: "license_revoked", mode, revoked_at }
 */

const machineIdSchema = z.object({
  windows_guid: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "must be a sha256 hex digest"),
  motherboard_serial: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "must be a sha256 hex digest"),
  cpu_id: z.string().regex(/^[0-9a-f]{64}$/i, "must be a sha256 hex digest"),
});

const bodySchema = z.object({
  license_string: z.string().min(1).max(4096),
  machine_id: machineIdSchema,
  // Free-text label, defaulted client-side to the Windows hostname.
  // Length cap matches the textbox in the customer portal rename UI.
  device_label: z.string().trim().min(1).max(80),
  // Atelier semver string. We don't strictly validate the format —
  // the client controls what it sends and we record whatever lands.
  atelier_version: z.string().min(1).max(40),
});

/**
 * Slim public projection of an activation, for slot-full responses.
 * Hides the machine_id components (privacy: another machine on the
 * same license shouldn't be able to scrape another buyer's hardware
 * fingerprints) and surfaces only what the License Entry picker needs.
 */
function publicSlot(a: {
  activation_id: string;
  device_label: string;
  first_activated_at: string;
  last_heartbeat_at: string;
  atelier_version: string;
}) {
  return {
    activation_id: a.activation_id,
    device_label: a.device_label,
    first_activated_at: a.first_activated_at,
    last_heartbeat_at: a.last_heartbeat_at,
    atelier_version: a.atelier_version,
  };
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const lid = parseLicenseId(body.license_string);
  if (!lid) {
    return NextResponse.json(
      { ok: false, error: "license_not_found" },
      { status: 404 },
    );
  }

  const license = await getLicense(lid);
  if (!license) {
    return NextResponse.json(
      { ok: false, error: "license_not_found" },
      { status: 404 },
    );
  }

  // Byte-for-byte equality. A malformed payload that happens to embed
  // a real lid still fails here because the signature half (and thus
  // the full string) won't match what we issued.
  if (license.key_string !== body.license_string) {
    return NextResponse.json(
      { ok: false, error: "license_not_found" },
      { status: 404 },
    );
  }

  if (license.status === "refunded") {
    return NextResponse.json(
      { ok: false, error: "license_refunded" },
      { status: 410 },
    );
  }
  if (license.status === "revoked") {
    return NextResponse.json(
      {
        ok: false,
        error: "license_revoked",
        mode: license.revocation_mode ?? "immediate",
        revoked_at: license.revoked_at ?? null,
      },
      { status: 410 },
    );
  }

  // Active license — proceed with slot allocation.
  const allActivations = await getActivationsForLicense(lid);
  const activeActivations = allActivations.filter(
    (a) => a.status === "active",
  );

  // 2-of-3 hardware match → refresh existing slot, no new slot consumed.
  const existing = activeActivations.find((a) =>
    matchesMachine(a.machine_id, body.machine_id),
  );
  if (existing) {
    const refreshed = await refreshActivationHeartbeat(
      existing,
      body.atelier_version,
    );
    return NextResponse.json({
      ok: true,
      activation_id: refreshed.activation_id,
      slot_count: activeActivations.length,
      max_slots: MAX_ACTIVATIONS_PER_LICENSE,
      first_activation: false,
    });
  }

  // No existing slot — check the cap before creating.
  if (activeActivations.length >= MAX_ACTIVATIONS_PER_LICENSE) {
    return NextResponse.json({
      ok: false,
      error: "slot_full",
      max_slots: MAX_ACTIVATIONS_PER_LICENSE,
      active_devices: activeActivations.map(publicSlot),
    });
  }

  const fresh = await createActivation({
    lid,
    machine_id: body.machine_id,
    device_label: body.device_label,
    atelier_version: body.atelier_version,
  });
  return NextResponse.json({
    ok: true,
    activation_id: fresh.activation_id,
    slot_count: activeActivations.length + 1,
    max_slots: MAX_ACTIVATIONS_PER_LICENSE,
    first_activation: allActivations.length === 0,
  });
}
