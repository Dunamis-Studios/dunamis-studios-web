import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/lib/session";
import { getLicense } from "@/lib/atelier-license-signing";
import {
  getActivation,
  renameActivation,
} from "@/lib/atelier-activation";

/**
 * POST /api/atelier/rename-device
 *
 * Customer portal endpoint. Lets the signed-in account give one of
 * its activation slots a friendlier label than the default Windows
 * hostname — useful when a buyer's three machines all auto-named
 * something like "DESKTOP-AB12CDE" and need disambiguation in the
 * licenses list.
 *
 * Auth: session cookie + license email match. The Atelier client
 * itself does not use this endpoint; rename is a customer-portal-
 * only action.
 */

const bodySchema = z.object({
  activation_id: z.string().uuid(),
  device_label: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

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

  const activation = await getActivation(parsed.data.activation_id);
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

  if (session.account.email.toLowerCase() !== license.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const updated = await renameActivation(
    parsed.data.activation_id,
    parsed.data.device_label,
  );
  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "activation_not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    ok: true,
    activation_id: updated.activation_id,
    device_label: updated.device_label,
  });
}
