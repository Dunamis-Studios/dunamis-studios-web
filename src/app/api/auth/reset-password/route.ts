import { NextResponse } from "next/server";
import { redis, KEY } from "@/lib/redis";
import { resetPasswordSchema } from "@/lib/validation";
import { apiError, parseJson } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getAccountById, saveAccount } from "@/lib/accounts";
import {
  createSession,
  destroyAllSessionsForAccount,
  setSessionCookie,
} from "@/lib/session";

interface ResetRecord {
  accountId: string;
  expiresAt: string;
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit("reset", ip, 10, 60 * 15);
  if (!rl.ok) {
    return apiError(429, "rate_limited", "Too many attempts — try again later.");
  }

  const parsed = await parseJson(req, resetPasswordSchema);
  if (!parsed.ok) return parsed.response;
  const { token, password } = parsed.data;

  const r = redis();
  const record = await r.get<ResetRecord>(KEY.resetPassword(token));
  if (!record) {
    return apiError(400, "invalid_token", "This link is invalid or has expired.");
  }
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    await r.del(KEY.resetPassword(token));
    return apiError(400, "invalid_token", "This link is invalid or has expired.");
  }

  const account = await getAccountById(record.accountId);
  if (!account) {
    return apiError(400, "invalid_token", "This link is invalid or has expired.");
  }

  account.passwordHash = await hashPassword(password);
  account.updatedAt = new Date().toISOString();
  await saveAccount(account);

  // One-time token
  await r.del(KEY.resetPassword(token));

  // Invalidate every existing session for safety, then create a fresh one.
  await destroyAllSessionsForAccount(account.accountId);
  const { jwt } = await createSession(account.accountId, {
    userAgent: req.headers.get("user-agent") ?? "unknown",
    ip,
  });
  await setSessionCookie(jwt);

  return NextResponse.json({ ok: true });
}
