/**
 * DELETE /api/account: customer-initiated account deletion (the
 * Danger Zone button on /account/settings). Soft-deletes the account
 * with a 30-day recovery window (purge happens out-of-band via a
 * scheduled job), destroys every session, and clears the cookie so
 * the same browser cannot continue using a now-orphaned session.
 *
 * The 30-day window is a deliberate UX choice: customers who hit
 * Delete by mistake can email support to reverse it. The grace
 * period also lets us untangle linked HubSpot installs cleanly via
 * the customer-facing app surfaces rather than racing a hard delete.
 */
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
