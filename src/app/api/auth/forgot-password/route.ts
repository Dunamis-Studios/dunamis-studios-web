/**
 * POST /api/auth/forgot-password: mint a one-hour reset token,
 * persist it under the resetPassword key factory entry, and
 * dispatch the reset email. Always responds 200 with `{ ok: true }`
 * regardless of whether the email matches a registered account, so
 * the response shape cannot be used to enumerate accounts. The
 * matching UI copy ("if an account exists for that email") is the
 * user-visible half of the same contract. Email-send failures are
 * logged but do not change the response.
 *
 * Rate-limited at 10 attempts per 15 minutes per IP.
 */
import { NextResponse } from "next/server";
import { redis, KEY } from "@/lib/redis";
import { forgotPasswordSchema } from "@/lib/validation";
import { apiError, parseJson } from "@/lib/api";
import { randomToken } from "@/lib/tokens";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getAccountByEmail } from "@/lib/accounts";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit("forgot", ip, 10, 60 * 15);
  if (!rl.ok) {
    return apiError(429, "rate_limited", "Too many attempts — try again later.");
  }

  const parsed = await parseJson(req, forgotPasswordSchema);
  if (!parsed.ok) return parsed.response;

  const account = await getAccountByEmail(parsed.data.email);
  // Always respond success — never leak account existence.
  if (account) {
    const token = randomToken(32);
    await redis().set(
      KEY.resetPassword(token),
      {
        accountId: account.accountId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
      { ex: 60 * 60 },
    );
    try {
      await sendPasswordResetEmail(account.email, account.firstName, token);
    } catch (err) {
      console.error("[forgot-password] email failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
