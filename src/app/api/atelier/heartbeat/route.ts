/**
 * Daily check-in from the Atelier desktop client. Refreshes the
 * activation's last-seen timestamp and surfaces revocation /
 * deactivation state so the client can decide whether to keep
 * running, show a soft warning, or lock. See POST docstring for the
 * three-job breakdown and the per-status client behavior.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { getLicense } from "@/lib/atelier-license-signing";
import {
  REVOCATION_GRACE_DAYS,
  getActivation,
  refreshActivationHeartbeat,
} from "@/lib/atelier-activation";
import { rateLimit } from "@/lib/ratelimit";

/**
 * POST /api/atelier/heartbeat
 *
 * Atelier checks in with this endpoint about once per day after first
 * activation, plus on every launch following an idle period of 7+
 * days. The endpoint does three jobs:
 *
 * 1. Confirm the activation is still in good standing — the slot
 *    hasn't been deactivated from another device or by the customer
 *    portal.
 * 2. Confirm the underlying license is still active (not refunded,
 *    not revoked, or revoked-with-still-in-grace).
 * 3. Refresh the last_heartbeat_at timestamp so the 30-day offline
 *    grace counter resets.
 *
 * The client uses the returned status to decide whether to keep
 * running, show a soft warning, or trigger lockdown:
 *   ok:true  — keep running, reset grace counter to today.
 *   ok:false error:"deactivated" — slot was deactivated elsewhere;
 *                                   client locks immediately.
 *   ok:false error:"license_refunded" — hard lock, no grace.
 *   ok:false error:"license_revoked" mode:"immediate" — hard lock.
 *   ok:false error:"license_revoked" mode:"grace_14d"
 *                                    grace_remaining_days:N — soft
 *                                    warn UI; lockdown only when N
 *                                    reaches 0.
 *
 * Heartbeat payload is intentionally minimal — license_string,
 * activation_id, atelier_version. Wedding data, vendor data, usage
 * data — none of it is part of this contract. See atelier-docs/
 * privacy.md for the public commitment.
 */

const bodySchema = z.object({
  license_string: z.string().min(1).max(4096),
  activation_id: z.string().uuid(),
  atelier_version: z.string().min(1).max(40),
});

function daysBetween(fromIso: string, to: Date): number {
  const fromMs = Date.parse(fromIso);
  if (Number.isNaN(fromMs)) return 0;
  return Math.floor((to.getTime() - fromMs) / (24 * 60 * 60 * 1000));
}

export async function POST(request: Request) {
  const rl = await rateLimit(request, "heartbeat");
  if (!rl.ok) return rl.response;

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

  if (activation.status === "deactivated") {
    return NextResponse.json(
      {
        ok: false,
        error: "deactivated",
        deactivated_at: activation.deactivated_at,
        deactivated_reason: activation.deactivated_reason,
      },
      { status: 410 },
    );
  }

  const license = await getLicense(activation.lid);
  if (!license) {
    // Activation orphaned from its license — shouldn't happen but
    // treat the same as a refunded license: hard stop, no grace.
    return NextResponse.json(
      { ok: false, error: "license_not_found" },
      { status: 404 },
    );
  }

  // Defense-in-depth: client must also resend the license_string,
  // and it must match what we issued for this lid.
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
    const mode = license.revocation_mode ?? "immediate";
    if (mode === "immediate") {
      return NextResponse.json(
        {
          ok: false,
          error: "license_revoked",
          mode: "immediate",
          revoked_at: license.revoked_at ?? null,
        },
        { status: 410 },
      );
    }
    // grace_14d: compute remaining days; if 0 or negative, lockdown.
    const elapsed = license.revoked_at
      ? daysBetween(license.revoked_at, new Date())
      : 0;
    const remaining = Math.max(0, REVOCATION_GRACE_DAYS - elapsed);
    if (remaining === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "license_revoked",
          mode: "grace_14d",
          revoked_at: license.revoked_at ?? null,
          grace_remaining_days: 0,
        },
        { status: 410 },
      );
    }
    // Within the grace window — refresh heartbeat (so the 30-day
    // offline counter still resets) and return a soft-warn payload.
    const refreshed = await refreshActivationHeartbeat(
      activation,
      body.atelier_version,
    );
    return NextResponse.json({
      ok: true,
      warn: "license_revoked_in_grace",
      mode: "grace_14d",
      revoked_at: license.revoked_at ?? null,
      grace_remaining_days: remaining,
      heartbeat_at: refreshed.last_heartbeat_at,
    });
  }

  // Active path — refresh heartbeat and return.
  const refreshed = await refreshActivationHeartbeat(
    activation,
    body.atelier_version,
  );
  return NextResponse.json({
    ok: true,
    heartbeat_at: refreshed.last_heartbeat_at,
  });
}
