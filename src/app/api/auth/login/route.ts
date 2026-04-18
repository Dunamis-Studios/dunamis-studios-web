import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { apiError, parseJson } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getAccountByEmail } from "@/lib/accounts";
import { createSession, setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit("login", ip, 10, 60 * 15);
  if (!rl.ok) {
    return apiError(429, "rate_limited", "Too many attempts — try again later.");
  }

  const parsed = await parseJson(req, loginSchema);
  if (!parsed.ok) return parsed.response;
  const { email, password } = parsed.data;

  const account = await getAccountByEmail(email);
  if (!account) {
    return apiError(401, "invalid_credentials", "Email or password is incorrect.");
  }
  const ok = await verifyPassword(password, account.passwordHash);
  if (!ok) {
    return apiError(401, "invalid_credentials", "Email or password is incorrect.");
  }

  const { jwt } = await createSession(account.accountId, {
    userAgent: req.headers.get("user-agent") ?? "unknown",
    ip,
  });
  await setSessionCookie(jwt);

  return NextResponse.json({ ok: true });
}
