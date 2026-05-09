import { NextResponse } from "next/server";
import { redis, KEY } from "@/lib/redis";
import { profileUpdateSchema } from "@/lib/validation";
import { apiError, parseJson } from "@/lib/api";
import { randomToken } from "@/lib/tokens";
import {
  getAccountByEmail,
  rotateAccountEmail,
} from "@/lib/accounts";
import { getCurrentSession } from "@/lib/session";
import { sendVerificationEmail } from "@/lib/email";
import { toPublicAccount } from "@/lib/types";

export async function PATCH(req: Request) {
  const current = await getCurrentSession();
  if (!current) {
    return apiError(401, "unauthenticated", "Please sign in.");
  }

  const parsed = await parseJson(req, profileUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { firstName, lastName, email, companyName, timeZone, logoUrl } =
    parsed.data;

  const account = current.account;
  const oldEmail = account.email;
  const emailChanged = email.toLowerCase() !== oldEmail.toLowerCase();

  if (emailChanged) {
    const clash = await getAccountByEmail(email);
    if (clash && clash.accountId !== account.accountId) {
      return apiError(
        409,
        "email_taken",
        "That email is already in use on another account.",
      );
    }
  }

  account.firstName = firstName.trim();
  account.lastName = lastName.trim();
  account.email = email;
  // Empty / whitespace-only / null all collapse to null so missing-
  // value checks stay a clean `companyName == null` test and the
  // customer can clear a mis-entered value.
  const trimmedCompany = companyName?.trim() ?? "";
  account.companyName = trimmedCompany.length === 0 ? null : trimmedCompany;
  // timeZone and logoUrl are optional in the request body — `undefined`
  // means "don't touch this field" so partial updates from the
  // settings page (which doesn't always rewrite every field) and from
  // the Atelier setup screen don't accidentally clobber values the
  // form didn't show. An explicit `null` is the customer clearing the
  // field. The schema has already validated `timeZone` against the
  // IANA list and `logoUrl` against the Vercel Blob host.
  if (timeZone !== undefined) account.timeZone = timeZone;
  if (logoUrl !== undefined) account.logoUrl = logoUrl;
  if (emailChanged) account.emailVerified = false;
  account.updatedAt = new Date().toISOString();

  await rotateAccountEmail(account, oldEmail);

  if (emailChanged) {
    const token = randomToken(32);
    await redis().set(
      KEY.verifyEmail(token),
      {
        accountId: account.accountId,
        email: account.email,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      },
      { ex: 60 * 60 * 24 },
    );
    try {
      await sendVerificationEmail(account.email, account.firstName, token);
    } catch (err) {
      console.error("[profile] verification email failed", err);
    }
  }

  return NextResponse.json({
    ok: true,
    emailChanged,
    account: toPublicAccount(account),
  });
}
