/**
 * GET /api/auth/me: whoami probe used by client components to bounce
 * already-signed-in visitors off transactional auth surfaces (login,
 * signup) and to surface the active account record. Returns 200 with
 * a null account on miss (not 401) so the client can branch on
 * `account === null` without treating "logged out" as an error.
 * Projects the account through toPublicAccount so the password hash
 * and other server-only fields never leave the server.
 */
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { toPublicAccount } from "@/lib/types";

export async function GET() {
  const s = await getCurrentSession();
  if (!s) {
    return NextResponse.json({ account: null }, { status: 200 });
  }
  return NextResponse.json({
    account: toPublicAccount(s.account),
    session: {
      sessionId: s.session.sessionId,
      createdAt: s.session.createdAt,
      expiresAt: s.session.expiresAt,
    },
  });
}
