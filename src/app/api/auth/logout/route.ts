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
