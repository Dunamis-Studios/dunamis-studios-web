import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import {
  clearSessionCookie,
  destroyAllSessionsForAccount,
  getCurrentSession,
} from "@/lib/session";
import { softDeleteAccount } from "@/lib/accounts";

/** Soft delete — 30-day recovery window per spec. */
export async function DELETE() {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");

  await softDeleteAccount(current.account.accountId);
  await destroyAllSessionsForAccount(current.account.accountId);
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
