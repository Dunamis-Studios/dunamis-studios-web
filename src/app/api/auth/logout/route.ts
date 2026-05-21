/**
 * POST /api/auth/logout: destroy the current session and clear the
 * HttpOnly session cookie. Idempotent: a logout call without an
 * active session still clears any stale cookie and returns 200. The
 * caller is expected to update its own UI on the response.
 */
import { NextResponse } from "next/server";
import { clearSessionCookie, destroySession, getCurrentSession } from "@/lib/session";

export async function POST() {
  const current = await getCurrentSession();
  if (current) {
    await destroySession(current.session.sessionId);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
