import { NextResponse } from "next/server";

import { apiError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { rateLimitBy } from "@/lib/ratelimit";
import { hasActiveProduct } from "@/lib/verification-key/active-product";
import {
  deriveKey,
  getCurrentWindow,
  windowStartMs,
  WINDOW_MS,
} from "@/lib/verification-key/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/support/verification-key/account
 *
 * Auth-only verification-key issuer for the support form's Mode A
 * widget. The caller must:
 *   - Be authenticated (existing session cookie).
 *   - Hold at least one Atelier license with status === "active" on
 *     their account.
 *
 * On success the response carries the freshly-derived key plus the
 * generated-at and expires-at instants so the widget can display
 * "valid for X more minutes" without re-deriving on the client. The
 * key itself is computed deterministically against the account email
 * so a second call within the same 30-minute window returns the same
 * value (idempotent; the widget's "regenerate" button only changes
 * the displayed key when the window flips, which matches user
 * expectation of "valid for 30 minutes from now").
 *
 * Rate limit: 6 per hour per accountId via the verify-key-account
 * limiter spec.
 */
export async function POST() {
  const session = await getCurrentSession();
  if (!session) {
    return apiError(401, "unauthenticated", "Please sign in.");
  }

  const { account } = session;
  const limited = await rateLimitBy(account.accountId, "verify-key-account");
  if (!limited.ok) return limited.response;

  const active = await hasActiveProduct(account.accountId, account.email);
  if (!active) {
    return apiError(
      403,
      "no_active_product",
      "Verification by account is available to customers with an active product. Use the email-based verification flow instead.",
    );
  }

  const window = getCurrentWindow();
  const key = deriveKey(account.email, window);
  const generatedAt = windowStartMs(window);
  const expiresAt = generatedAt + WINDOW_MS;

  return NextResponse.json({
    ok: true,
    key,
    email: account.email,
    generated_at: new Date(generatedAt).toISOString(),
    expires_at: new Date(expiresAt).toISOString(),
    mode: "account" as const,
  });
}
