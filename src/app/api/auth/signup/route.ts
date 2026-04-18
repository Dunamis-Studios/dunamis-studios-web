import { NextResponse } from "next/server";
import { redis, KEY } from "@/lib/redis";
import { signupSchema } from "@/lib/validation";
import { apiError, parseJson } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { uuid, randomToken } from "@/lib/tokens";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  getAccountByEmail,
  saveAccount,
  getAccountIdByEmail,
} from "@/lib/accounts";
import { createSession, setSessionCookie } from "@/lib/session";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import type { Account } from "@/lib/types";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit("signup", ip, 10, 60 * 15);
  if (!rl.ok) {
    return apiError(429, "rate_limited", "Too many attempts — try again later.");
  }

  const parsed = await parseJson(req, signupSchema);
  if (!parsed.ok) return parsed.response;
  const { email, firstName, lastName, password } = parsed.data;

  const existing = await getAccountByEmail(email);
  if (existing) {
    return apiError(
      409,
      "account_exists",
      "An account with that email already exists.",
    );
  }
  // Double-check via index for race safety
  const idxHit = await getAccountIdByEmail(email);
  if (idxHit) {
    return apiError(409, "account_exists", "An account with that email already exists.");
  }

  const now = new Date().toISOString();
  const account: Account = {
    accountId: uuid(),
    email,
    emailVerified: false,
    passwordHash: await hashPassword(password),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await saveAccount(account);

  const token = randomToken(32);
  await redis().set(
    KEY.verifyEmail(token),
    { accountId: account.accountId, email: account.email, expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
    { ex: 60 * 60 * 24 },
  );

  const { jwt } = await createSession(account.accountId, {
    userAgent: req.headers.get("user-agent") ?? "unknown",
    ip,
  });
  await setSessionCookie(jwt);

  // Best-effort email sends — don't fail signup if email provider is down.
  try {
    await Promise.all([
      sendVerificationEmail(account.email, account.firstName, token),
      sendWelcomeEmail(account.email, account.firstName),
    ]);
  } catch (err) {
    console.error("[signup] email send failed", err);
  }

  return NextResponse.json({ ok: true });
}
