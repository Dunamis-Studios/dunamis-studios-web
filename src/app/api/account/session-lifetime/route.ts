import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { saveAccount } from "@/lib/accounts";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  days: z.union([z.literal(1), z.literal(3), z.literal(7)]),
});

/**
 * POST /api/account/session-lifetime
 *
 * Body: { days: 1 | 3 | 7 }
 * Response: { ok: true, sessionLifetimeDays: number }
 *
 * Updates the signed-in account's preferred session lifetime. The
 * new value applies to the next session created for this account
 * (next login, password change, or password reset). The CURRENT
 * session keeps its original expiry; the user can wipe existing
 * sessions via "Sign out of all others" if they want the new value
 * to take effect immediately.
 */
export async function POST(req: Request) {
  const current = await getCurrentSession();
  if (!current) return apiError(401, "unauthenticated", "Please sign in.");

  const ip = clientIp(req.headers);
  const rl = await rateLimit("account-session-lifetime", ip, 10, 60 * 15);
  if (!rl.ok) {
    return apiError(
      429,
      "rate_limited",
      "Too many updates. Try again in a few minutes.",
    );
  }

  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { days } = parsed.data;

  current.account.sessionLifetimeDays = days;
  current.account.updatedAt = new Date().toISOString();
  await saveAccount(current.account);

  return NextResponse.json({ ok: true, sessionLifetimeDays: days });
}
