import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import {
  destroyAllSessionsForAccount,
  getCurrentSession,
  listSessionsForAccount,
} from "@/lib/session";

export async function GET() {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");
  const sessions = await listSessionsForAccount(current.account.accountId);
  return NextResponse.json({
    sessions: sessions.map((s) => ({
      ...s,
      current: s.sessionId === current.session.sessionId,
    })),
  });
}

/** Revoke every session except the current one — ‘sign out everywhere else’. */
export async function DELETE() {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");
  await destroyAllSessionsForAccount(
    current.account.accountId,
    current.session.sessionId,
  );
  return NextResponse.json({ ok: true });
}
