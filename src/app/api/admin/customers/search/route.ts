import { NextResponse } from "next/server";
import { z } from "zod";

import {
  requireAdmin,
  isAdminAllowlistConfigured,
  ADMIN_ALLOWLIST_UNCONFIGURED_BODY,
} from "@/lib/session";
import { getAccountByEmail } from "@/lib/accounts";
import { rateLimitBy } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/customers/search?email={addr}
 *
 * As-you-type search endpoint for the admin customers page AND the
 * one-shot account lookup for the license issuance UI. Returns a
 * `results` array shape (zero or one entries today; the array is
 * forward-compatible with future fuzzy / prefix search). Rate-limited
 * at 30/min keyed on the admin's email (not IP) so multiple admins
 * behind a shared NAT don't collide.
 *
 * This endpoint absorbed the former `/api/admin/lookup-account` route
 * during the day-of-launch backlog cleanup. The issuance UI in
 * /admin/licenses now consumes the array shape directly and coalesces
 * its nullable name fields when adapting the entry into its local
 * ResolvedAccount shape.
 *
 * Auth: gated by ADMIN_EMAILS via requireAdmin(). Returns 503 in
 * dev when the allowlist is unconfigured (matches sibling admin
 * route convention).
 */

const querySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .email("Enter a valid email address"),
});

export async function GET(request: Request) {
  if (!isAdminAllowlistConfigured()) {
    return NextResponse.json(ADMIN_ALLOWLIST_UNCONFIGURED_BODY, { status: 503 });
  }

  let admin;
  try {
    admin = await requireAdmin();
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const limited = await rateLimitBy(admin.account.email, "admin");
  if (!limited.ok) return limited.response;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    email: url.searchParams.get("email") ?? "",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const account = await getAccountByEmail(parsed.data.email);
  if (!account) {
    return NextResponse.json({ results: [] });
  }

  // lastLoginAt is not on the Account type today. The closest signal
  // is the most-recent entry in `dunamis:account-sessions:{accountId}`,
  // resolved per-session in the customer detail page where the cost
  // is justified. The search results omit it for now and return
  // createdAt so each row has a meaningful date stamp.
  return NextResponse.json({
    results: [
      {
        accountId: account.accountId,
        email: account.email,
        firstName: account.firstName ?? null,
        lastName: account.lastName ?? null,
        companyName: account.companyName ?? null,
        createdAt: account.createdAt,
      },
    ],
  });
}
