import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";
import { getEntitlementsForAccount } from "@/lib/accounts";

export async function GET() {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");
  const entitlements = await getEntitlementsForAccount(current.account.accountId);
  return NextResponse.json({ entitlements });
}
