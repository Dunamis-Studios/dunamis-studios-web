import { NextResponse } from "next/server";
import { z } from "zod";

import {
  requireAdmin,
  isAdminAllowlistConfigured,
  ADMIN_ALLOWLIST_UNCONFIGURED_BODY,
} from "@/lib/session";
import { getAccountByEmail } from "@/lib/accounts";

/**
 * GET /api/admin/lookup-account?email={addr}
 *
 * Resolve an email address to its Dunamis Studios account. Used by
 * the admin issuance UI to bind a license to a Dunamis account at
 * issuance time — the picker types an email, we resolve it here, the
 * admin sees the account's name + company before clicking Issue.
 *
 * Returns:
 *   200 { found: true, account: { accountId, email, firstName, lastName, companyName } }
 *     when the email maps to an existing, non-deleted account.
 *   200 { found: false } when no account exists for this email.
 *   400 on missing/malformed input.
 *   503 in dev when ADMIN_EMAILS isn't configured.
 *
 * The slim projection deliberately excludes passwordHash, sessions,
 * entitlements, and consent state — admins issuing licenses don't
 * need them, and minimizing the response shape keeps log noise low.
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

  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

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
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    account: {
      accountId: account.accountId,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      companyName: account.companyName ?? null,
    },
  });
}
