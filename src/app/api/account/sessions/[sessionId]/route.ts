/**
 * DELETE /api/account/sessions/[sessionId]: revoke a specific
 * session by id. Refuses to act on a session that does not belong
 * to the caller (404, so the response cannot be used to probe other
 * accounts' session ids). If the caller revokes its own session,
 * the cookie is cleared in the same call so the browser does not
 * keep a token for a session that no longer exists.
 */
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { redis, KEY } from "@/lib/redis";
import {
  clearSessionCookie,
  destroySession,
  getCurrentSession,
} from "@/lib/session";
import type { Session } from "@/lib/types";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await ctx.params;
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");

  // Only allow revoking sessions that belong to this account.
  const target = await redis().get<Session>(KEY.session(sessionId));
  if (!target || target.accountId !== current.account.accountId) {
    return apiError(404, "not_found", "Session not found.");
  }

  await destroySession(sessionId);

  // If they revoked their own session, clear the cookie too.
  if (sessionId === current.session.sessionId) {
    await clearSessionCookie();
  }

  return NextResponse.json({ ok: true });
}
