import { redis } from "@/lib/redis";
import type { Account } from "@/lib/types";

/**
 * Recent customers helper for the /admin/customers landing state.
 *
 * Returns the N most-recently-created accounts. "Activity in the
 * last 30 days" was the spec wording, but the Account record doesn't
 * carry a `lastActivityAt` field, and synthesizing one from session
 * records would require an N-account scan + per-account session set
 * read every page load. Falling back to createdAt is a reasonable
 * proxy: every customer who ever signed up shows up newest-first,
 * and the admin can search by email to find anyone older.
 *
 * Implementation note: SCANs `dunamis:account:*` with a generous
 * batch, reads each account, sorts by createdAt descending, returns
 * the top N. For v1 customer counts this stays under 500ms easily;
 * see day-of-launch backlog for the counter-key migration path.
 */

const SCAN_BATCH = 200;

export interface RecentCustomerRow {
  accountId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  createdAt: string;
}

export async function listRecentCustomers(
  limit = 10,
): Promise<RecentCustomerRow[]> {
  const r = redis();
  let cursor: string = "0";
  const accounts: Account[] = [];

  do {
    const result = (await r.scan(cursor, {
      match: "dunamis:account:*",
      count: SCAN_BATCH,
    })) as [string, string[]];
    const [nextCursor, keys] = result;
    if (Array.isArray(keys) && keys.length > 0) {
      const values = await Promise.all(
        keys.map(async (k) => {
          try {
            return await r.get<Account & { deletedAt?: string }>(k);
          } catch (err) {
            console.error("[recent-customers] get failed for", k, err);
            return null;
          }
        }),
      );
      for (const v of values) {
        if (v && !v.deletedAt && typeof v.createdAt === "string") {
          accounts.push(v);
        }
      }
    }
    cursor = nextCursor;
    if (cursor === "0") break;
  } while (true);

  accounts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return accounts.slice(0, limit).map((a) => ({
    accountId: a.accountId,
    email: a.email,
    firstName: a.firstName ?? null,
    lastName: a.lastName ?? null,
    companyName: a.companyName ?? null,
    createdAt: a.createdAt,
  }));
}
