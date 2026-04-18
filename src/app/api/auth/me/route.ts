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
