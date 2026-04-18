import { NextResponse } from "next/server";
import { redis, KEY } from "@/lib/redis";
import { verifyEmailSchema } from "@/lib/validation";
import { apiError, parseJson } from "@/lib/api";
import { getAccountById, saveAccount } from "@/lib/accounts";

interface VerifyRecord {
  accountId: string;
  email: string;
  expiresAt: string;
}

export async function POST(req: Request) {
  const parsed = await parseJson(req, verifyEmailSchema);
  if (!parsed.ok) return parsed.response;

  const r = redis();
  const record = await r.get<VerifyRecord>(KEY.verifyEmail(parsed.data.token));
  if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
    return apiError(400, "invalid_token", "This link is invalid or has expired.");
  }

  const account = await getAccountById(record.accountId);
  if (!account) {
    return apiError(400, "invalid_token", "Account not found.");
  }
  if (account.email.toLowerCase() !== record.email.toLowerCase()) {
    // Email changed since token issued — stale link.
    await r.del(KEY.verifyEmail(parsed.data.token));
    return apiError(400, "invalid_token", "This link is no longer valid.");
  }

  if (!account.emailVerified) {
    account.emailVerified = true;
    account.updatedAt = new Date().toISOString();
    await saveAccount(account);
  }
  await r.del(KEY.verifyEmail(parsed.data.token));

  return NextResponse.json({ ok: true });
}
