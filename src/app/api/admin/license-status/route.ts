/**
 * Mark an Atelier license as refunded or revoked. The signed
 * license string itself stays cryptographically valid (offline
 * verification still passes), but the next activate/heartbeat
 * online check branches on the recorded status to lock the
 * client. See POST docstring for the per-status lock policy
 * (immediate vs 14-day grace).
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  requireAdmin,
  isAdminAllowlistConfigured,
  ADMIN_ALLOWLIST_UNCONFIGURED_BODY,
} from "@/lib/session";
import { setLicenseStatus } from "@/lib/atelier-license-signing";

/**
 * POST /api/admin/license-status
 *
 * Mark a license as refunded or revoked. The license string itself
 * remains cryptographically valid by design (offline verification of
 * the Ed25519 signature still passes), but the activation /
 * heartbeat endpoints branch on the recorded status:
 *
 *   - "refunded": next activate or heartbeat returns
 *     license_refunded and the client locks immediately.
 *   - "revoked": next activate or heartbeat branches on revocation
 *     mode. "immediate" hard-locks instantly; "grace_14d" sends a
 *     soft warning and only locks if the heartbeat is still hitting
 *     a revoked license 14 days after revoked_at.
 *
 * The mode is admin-chosen per revocation in the modal — refunds
 * default to grace, breach-driven revocations typically use
 * immediate. Reason is free-text commentary stored on the record
 * for audit; the customer never sees it.
 *
 * Setting status back to "active" is not allowed via this endpoint.
 * If a status flip is genuinely needed (a refund that gets reversed),
 * edit the record directly via the Upstash dashboard.
 */

const bodySchema = z
  .object({
    lid: z.string().trim().min(1).max(64),
    status: z.enum(["refunded", "revoked"]),
    revocation_mode: z.enum(["immediate", "grace_14d"]).optional(),
    revocation_reason: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) => v.status !== "revoked" || v.revocation_mode != null,
    "revocation_mode is required when status is revoked",
  );

export async function POST(request: Request) {
  if (!isAdminAllowlistConfigured()) {
    return NextResponse.json(ADMIN_ALLOWLIST_UNCONFIGURED_BODY, { status: 503 });
  }

  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = await setLicenseStatus(parsed.data.lid, parsed.data.status, {
    revocation_mode: parsed.data.revocation_mode,
    revocation_reason: parsed.data.revocation_reason,
    revoked_by_admin_email: admin.account.email,
  });
  if (!updated) {
    return NextResponse.json({ error: "License not found." }, { status: 404 });
  }

  return NextResponse.json({ record: updated });
}
