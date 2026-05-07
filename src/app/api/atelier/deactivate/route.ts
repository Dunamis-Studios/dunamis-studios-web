import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/lib/session";
import { getLicense, parseLicenseId } from "@/lib/atelier-license-signing";
import {
  deactivateActivation,
  getActivation,
} from "@/lib/atelier-activation";

/**
 * POST /api/atelier/deactivate
 *
 * Frees one of the three slots on a license. Called by:
 *   1. The Atelier client itself (Settings → License → "Deactivate
 *      this device") — authenticated via license_string equality
 *      against the canonical key_string. Reason recorded as "self".
 *   2. The Atelier client when the License Entry slot-full picker
 *      lets a customer evict another device — same auth, reason
 *      recorded as "other_device".
 *   3. The customer portal at /account/atelier-licenses — auth via
 *      session cookie + email match against the license. Reason
 *      recorded as "customer_portal".
 *
 * Admin path is its own endpoint (admin tooling) and is not handled
 * here; admins set reason "admin" through that path.
 *
 * Body shape supports both auth modes:
 *   - { activation_id, license_string, source: "self"|"other_device" }
 *     — license-string auth, used by the Atelier client.
 *   - { activation_id, source: "customer_portal" } — session-cookie
 *     auth, used by /account/atelier-licenses.
 *
 * Response: { ok: true, activation_id, status: "deactivated" } on
 * success. Repeated calls against an already-deactivated slot return
 * the same shape (idempotent). Mismatched auth returns 403.
 */

const clientBodySchema = z.object({
  activation_id: z.string().uuid(),
  license_string: z.string().min(1).max(4096),
  source: z.enum(["self", "other_device"]),
});

const portalBodySchema = z.object({
  activation_id: z.string().uuid(),
  source: z.literal("customer_portal"),
});

const bodySchema = z.union([clientBodySchema, portalBodySchema]);

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

  const activation = await getActivation(body.activation_id);
  if (!activation) {
    return NextResponse.json(
      { ok: false, error: "activation_not_found" },
      { status: 404 },
    );
  }

  const license = await getLicense(activation.lid);
  if (!license) {
    return NextResponse.json(
      { ok: false, error: "license_not_found" },
      { status: 404 },
    );
  }

  // Authorize the request based on which body shape we received.
  if (body.source === "customer_portal") {
    // Session-cookie auth. The signed-in account's email must match
    // the license's email — case-insensitive, since both addresses
    // were lowercased on intake.
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    if (
      session.account.email.toLowerCase() !== license.email.toLowerCase()
    ) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }
  } else {
    // license_string auth. Must match what we issued, byte-for-byte,
    // and the activation must belong to that license. parseLicenseId
    // is a quick rejection path for malformed inputs.
    const lid = parseLicenseId(body.license_string);
    if (!lid || lid !== activation.lid) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }
    if (license.key_string !== body.license_string) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }
  }

  const result = await deactivateActivation(body.activation_id, body.source);
  if (!result) {
    return NextResponse.json(
      { ok: false, error: "activation_not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    ok: true,
    activation_id: result.activation_id,
    status: result.status,
  });
}
