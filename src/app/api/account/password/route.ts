import { NextResponse } from "next/server";
import { changePasswordSchema } from "@/lib/validation";
import { apiError, parseJson } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/password";
import { saveAccount } from "@/lib/accounts";
import {
  createSession,
  destroyAllSessionsForAccount,
  getCurrentSession,
  setSessionCookie,
} from "@/lib/session";
import { clientIp } from "@/lib/rate-limit";

export async function PATCH(req: Request) {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");

  const parsed = await parseJson(req, changePasswordSchema);
  if (!parsed.ok) return parsed.response;
  const { currentPassword, newPassword } = parsed.data;

  const ok = await verifyPassword(currentPassword, current.account.passwordHash);
  if (!ok) {
    return apiError(400, "invalid_current", "Current password is incorrect.");
  }

  current.account.passwordHash = await hashPassword(newPassword);
  current.account.updatedAt = new Date().toISOString();
  await saveAccount(current.account);

  // Kill all other sessions, keep a fresh one for the current actor.
  await destroyAllSessionsForAccount(current.account.accountId);
  const { jwt } = await createSession(current.account.accountId, {
    userAgent: req.headers.get("user-agent") ?? "unknown",
    ip: clientIp(req.headers),
  });
  await setSessionCookie(jwt);

  return NextResponse.json({ ok: true });
}
