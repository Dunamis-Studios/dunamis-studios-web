import { NextResponse } from "next/server";

import { apiError } from "../api";

/**
 * Verify a Vercel cron request. Vercel cron sends an `Authorization:
 * Bearer ${CRON_SECRET}` header when the env var is configured on the
 * project; without it, anyone could hit the cron endpoints and trigger
 * destructive cleanup. We reject any request that doesn't carry the
 * matching token.
 *
 * Returns null on success (caller continues), a NextResponse on failure
 * (caller returns it directly).
 */
export function authorizeCron(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return apiError(
      503,
      "cron_secret_unconfigured",
      "CRON_SECRET is not configured on this Vercel project.",
    );
  }
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return apiError(401, "cron_unauthenticated", "Cron requires Bearer auth.");
  }
  const token = auth.slice(7);
  if (token !== expected) {
    return apiError(403, "cron_forbidden", "Cron token mismatch.");
  }
  return null;
}
