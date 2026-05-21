/**
 * PATCH /api/account/password: signed-in password change. Requires
 * the current password (no token; this is the in-app change path,
 * not reset). On success, kills every other session for the account
 * and mints a fresh session for the caller so the active browser
 * does not log itself out.
 *
 * Wiping sibling sessions matches the reset-password contract:
 * password rotations always end the cohort of devices that knew the
 * prior credential. Reset is for "I lost it," this is for "I want a
 * new one."
 */
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
  const { jwt, lifetimeSec } = await createSession(
    current.account.accountId,
    {
      userAgent: req.headers.get("user-agent") ?? "unknown",
      ip: clientIp(req.headers),
    },
  );
  await setSessionCookie(jwt, lifetimeSec);

  return NextResponse.json({ ok: true });
}
