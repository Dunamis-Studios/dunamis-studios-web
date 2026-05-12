import "server-only";

import { redis, KEY } from "@/lib/redis";
import {
  listTicketsForCustomerEmail,
  type HubSpotTicketSummary,
} from "@/lib/hubspot/tickets";
import { verifyKeyForTimestamp } from "@/lib/verification-key/service";

const CACHE_TTL_SECONDS = 5 * 60;

/**
 * Re-verification status for a ticket's stored verification key.
 *
 *   "matches"   The key still verifies against the customer's email at
 *               the ticket's createdate (within the ±1 window
 *               tolerance verifyKeyForTimestamp builds in). The
 *               customer's identity was confirmed at submission and
 *               that proof still holds today.
 *
 *   "mismatch"  The key does NOT verify. This is the load-bearing
 *               signal: it means either the secret rotated (every
 *               historical ticket flips to mismatch in lockstep, which
 *               is its own legitimate signal an admin can recognize)
 *               OR the key was forged for a different email and slipped
 *               past the server-side gate somehow. Both warrant a look.
 *
 *   "missing"   The ticket has no identity_verification_reference set.
 *               Either pre-dates the verification key rollout, or was
 *               opened via a path that bypasses /api/support-submit
 *               (direct HubSpot form submission, manual ticket
 *               creation in the help desk, etc.).
 */
export type VerificationKeyStatus = "matches" | "mismatch" | "missing";

export interface VerificationKeyRow {
  ticketId: string;
  subject: string | null;
  createdAt: string;
  verificationKey: string | null;
  status: VerificationKeyStatus;
}

/**
 * Fetch the customer's HubSpot tickets, re-verify each ticket's
 * stored verification key against the customer's email at the
 * ticket's createdate, and return the rows the admin section
 * renders.
 *
 * Cached in Redis for 5 minutes per account so flipping between admin
 * pages does not hammer the HubSpot Search API. The cache stores the
 * raw ticket summary; re-verification runs on every page render so a
 * VERIFICATION_KEY_SECRET rotation reflects in badges immediately
 * without busting the cache.
 *
 * Pass `force: true` to bypass the cache (the Refresh button does this
 * via the /refresh route).
 */
export async function getCustomerVerificationKeyRows(
  accountId: string,
  email: string,
  opts: { force?: boolean } = {},
): Promise<VerificationKeyRow[]> {
  const cacheKey = KEY.adminVerificationKeyTickets(accountId);
  const r = redis();

  let tickets: HubSpotTicketSummary[] | null = null;

  if (!opts.force) {
    try {
      const cached = await r.get<HubSpotTicketSummary[]>(cacheKey);
      if (Array.isArray(cached)) tickets = cached;
    } catch (err) {
      console.error(
        "[verification-keys] cache read failed; falling back to HubSpot",
        { error: err instanceof Error ? err.message : String(err) },
      );
    }
  }

  if (!tickets) {
    tickets = await listTicketsForCustomerEmail(email);
    try {
      await r.set(cacheKey, tickets, { ex: CACHE_TTL_SECONDS });
    } catch (err) {
      console.error("[verification-keys] cache write failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return tickets.map((t) => {
    const verificationKey = t.identityVerificationReference;
    let status: VerificationKeyStatus;
    if (!verificationKey) {
      status = "missing";
    } else {
      const createdMs = Date.parse(t.createdAt);
      const ok =
        Number.isFinite(createdMs) &&
        verifyKeyForTimestamp(email, verificationKey, createdMs);
      status = ok ? "matches" : "mismatch";
    }
    return {
      ticketId: t.id,
      subject: t.subject,
      createdAt: t.createdAt,
      verificationKey,
      status,
    };
  });
}

/**
 * Bust the Redis cache for a customer's verification keys. The
 * /refresh route calls this before redirecting back to the admin
 * page so the next render re-fetches from HubSpot.
 */
export async function invalidateCustomerVerificationKeyCache(
  accountId: string,
): Promise<void> {
  try {
    await redis().del(KEY.adminVerificationKeyTickets(accountId));
  } catch (err) {
    console.error("[verification-keys] cache invalidate failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
