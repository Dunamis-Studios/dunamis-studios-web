import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { apiError, parseJson } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getAccountByEmail } from "@/lib/accounts";
import { createSession, setSessionCookie } from "@/lib/session";

// Pre-computed bcryptjs hash at cost 12. Used to burn the same ~200-400ms
// of CPU on login attempts where the email does not exist, so the response
// time is indistinguishable from a failed password against a real account.
// Without this, an attacker can enumerate registered emails by measuring
// response latency: a "no such account" path returned instantly while a
// real account ran a full bcrypt.compare. The plaintext hashed here was a
// single-use random 64-hex string -- not a dictionary word -- so a hash
// leak gives no useful brute-force target.
const DUMMY_BCRYPT_HASH =
  "$2a$12$qqsVy0ViQrKAKOxKl7yjwejyH.DpDe1HB0wa2etbfGyXRwY8MyQGC";

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
    // Burn the same bcrypt cost as a real verify so the response time is
    // indistinguishable from a wrong-password-against-a-real-account path.
    await verifyPassword(password, DUMMY_BCRYPT_HASH);
    return apiError(401, "invalid_credentials", "Email or password is incorrect.");
  }
  const ok = await verifyPassword(password, account.passwordHash);
  if (!ok) {
    return apiError(401, "invalid_credentials", "Email or password is incorrect.");
  }

  const { jwt, lifetimeSec } = await createSession(account.accountId, {
    userAgent: req.headers.get("user-agent") ?? "unknown",
    ip,
  });
  await setSessionCookie(jwt, lifetimeSec);

  return NextResponse.json({ ok: true });
}
