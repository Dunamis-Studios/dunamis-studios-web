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
