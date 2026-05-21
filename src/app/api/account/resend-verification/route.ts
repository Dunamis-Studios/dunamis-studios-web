/**
 * POST /api/account/resend-verification: mint a fresh 24h verification
 * token for the signed-in account and dispatch the email. Rate-limited
 * at 5 per 15 minutes per account (not per IP) so a user sharing an
 * office IP can't be locked out by someone else's spam. Returns
 * `{ ok: true, alreadyVerified: true }` when the email is already
 * verified so the UI can render the matching confirmation.
 */
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { redis, KEY } from "@/lib/redis";
import { randomToken } from "@/lib/tokens";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentSession } from "@/lib/session";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");

  const rl = await rateLimit(
    "resend-verify",
    current.account.accountId,
    5,
    60 * 15,
  );
  if (!rl.ok) {
    return apiError(429, "rate_limited", "Please wait before requesting another email.");
  }

  if (current.account.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const token = randomToken(32);
  await redis().set(
    KEY.verifyEmail(token),
    {
      accountId: current.account.accountId,
      email: current.account.email,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    },
    { ex: 60 * 60 * 24 },
  );

  try {
    await sendVerificationEmail(
      current.account.email,
      current.account.firstName,
      token,
    );
  } catch (err) {
    console.error("[resend-verify] email failed", err);
    return apiError(500, "email_failed", "Could not send email. Please try again.");
  }

  return NextResponse.json({ ok: true });
}
