import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, parseJson } from "@/lib/api";
import {
  consumeExchangeCode,
  issueAccessToken,
  verifyToken,
} from "@/lib/sync/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync/auth/exchange
 *
 * Trade either a one-time exchange code (post-Stripe-checkout deep
 * link) or a 5-minute QR pairing token (PWA scan) for a 24-hour Bearer
 * access token. Single-use on both paths: an exchange code is consumed
 * atomically, and a QR token is rejected after its 5-minute TTL.
 *
 * Discriminated by which field the body carries.
 */
const bodySchema = z
  .object({
    code: z.string().trim().min(1).max(256).optional(),
    qr_token: z.string().trim().min(1).max(2048).optional(),
  })
  .refine(
    (v) => Boolean(v.code) !== Boolean(v.qr_token),
    "Provide exactly one of code or qr_token",
  );

export async function POST(request: Request) {
  const parsed = await parseJson(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  let customerId: string | null = null;

  if (body.code) {
    customerId = await consumeExchangeCode(body.code);
    if (!customerId) {
      return apiError(
        401,
        "invalid_code",
        "Exchange code is invalid, expired, or already used.",
      );
    }
  } else if (body.qr_token) {
    const claims = await verifyToken(body.qr_token);
    if (!claims || claims.kind !== "qr") {
      return apiError(
        401,
        "invalid_qr_token",
        "QR token is invalid, expired, or not a pairing token.",
      );
    }
    customerId = claims.cid;
  }

  if (!customerId) {
    // Defensive — the .refine() above guarantees one branch fires.
    return apiError(400, "invalid_request", "No credential supplied.");
  }

  const { token, exp } = await issueAccessToken(customerId);
  return NextResponse.json({
    access_token: token,
    token_type: "Bearer",
    expires_at: new Date(exp * 1000).toISOString(),
    customer_id: customerId,
  });
}
