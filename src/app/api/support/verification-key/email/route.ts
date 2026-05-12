import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError, parseJson } from "@/lib/api";
import { rateLimit, rateLimitBy } from "@/lib/ratelimit";
import { sendVerificationKeyEmail } from "@/lib/email-verification-key";
import {
  deriveKey,
  getCurrentWindow,
} from "@/lib/verification-key/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Email is required")
    .max(254, "Email is too long")
    .email("Enter a valid email address"),
});

/**
 * POST /api/support/verification-key/email
 *
 * Public verification-key issuer for the Mode B widget. Anyone can
 * submit any email; the route derives a key for that email and
 * sends it via Resend. The route's response shape is the same for
 * every legal request regardless of whether the email is "in our
 * system" (Atelier license, HubSpot install, anonymous visitor):
 * intentional, to prevent the endpoint from leaking enumeration
 * signal. Whoever controls the inbox sees the key; whoever does not,
 * does not.
 *
 * Two rate-limit dimensions stack:
 *   - 3 per hour per submitted email (verify-key-email): caps the
 *     "spam one inbox" attack.
 *   - 10 per hour per truncated IP (verify-key-email-ip): caps the
 *     "spray many emails from one sender" attack the per-email
 *     limiter cannot see.
 * Either tripping returns 429 with a friendly retry-after message.
 *
 * Successful sends always return the same shape so the widget can
 * advance to the paste-the-key state without leaking whether the
 * email made it out (Resend can fail asynchronously; the customer
 * has to look at their inbox either way).
 */
export async function POST(req: Request) {
  const ipLimit = await rateLimit(req, "verify-key-email-ip");
  if (!ipLimit.ok) return ipLimit.response;

  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;

  const email = parsed.data.email;

  const emailLimit = await rateLimitBy(email, "verify-key-email");
  if (!emailLimit.ok) return emailLimit.response;

  const window = getCurrentWindow();
  const key = deriveKey(email, window);

  try {
    await sendVerificationKeyEmail({ to: email, key });
  } catch (err) {
    // Resend send failure: log loudly but do not leak the failure
    // to the client. The widget always advances; the customer either
    // sees the email or asks for a resend. Surfacing a 5xx here would
    // also leak that this address was reachable enough for Resend to
    // accept the request, which is itself a signal.
    console.error("[verify-key-email] send failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Check your inbox for the verification key.",
    mode: "email" as const,
  });
}
