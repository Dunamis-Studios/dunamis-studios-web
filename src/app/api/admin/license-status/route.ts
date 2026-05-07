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
 * remains cryptographically valid (Atelier has no online revocation
 * in v1 by design — see EULA §6.4); this endpoint just records the
 * administrative status for support and reporting purposes.
 *
 * Setting status back to "active" is not allowed via this endpoint —
 * once a license is marked refunded or revoked, the canonical record
 * in Redis reflects that state. If a status flip is genuinely
 * needed (e.g. a refund that gets reversed), edit the record directly
 * via the Upstash dashboard or extend the validation to include
 * "active" as a target.
 */

const bodySchema = z.object({
  lid: z.string().trim().min(1).max(64),
  status: z.enum(["refunded", "revoked"]),
});

export async function POST(request: Request) {
  // Fast 503 in dev where ADMIN_EMAILS is intentionally unset.
  if (!isAdminAllowlistConfigured()) {
    return NextResponse.json(ADMIN_ALLOWLIST_UNCONFIGURED_BODY, { status: 503 });
  }

  try {
    await requireAdmin();
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
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const updated = await setLicenseStatus(parsed.data.lid, parsed.data.status);
  if (!updated) {
    return NextResponse.json({ error: "License not found." }, { status: 404 });
  }

  return NextResponse.json({ record: updated });
}
