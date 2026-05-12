import { redis } from "@/lib/redis";

/**
 * Dashboard stats service.
 *
 * Counts run via SCAN with a small page size so the call never
 * blocks Redis on a large keyspace. For v1 with a low customer count,
 * on-demand scans return in well under 500ms. If the customer count
 * grows past ~5K, the right next step is to maintain dedicated
 * counter keys (e.g., `count:accounts`, `count:active-licenses`)
 * incremented on write rather than scanned on read. That migration is
 * gated by actual scan times in production; see the day-of-launch
 * backlog entry for revisiting.
 *
 * openTickets stays null until the HubSpot integration lands.
 * pendingDataExportsLast7d stays null because the existing
 * data-export flow is synchronous (no pending state to count). Both
 * tiles render as placeholders rather than misleading zeros.
 */

const SCAN_BATCH = 200;

export interface DashboardStats {
  totalAccounts: number;
  activeAtelierLicenses: number;
  activationsLast24h: number;
  openTickets: number | null;
  pendingDataExportsLast7d: number | null;
}

async function countMatching(match: string): Promise<number> {
  const r = redis();
  let cursor: string = "0";
  let total = 0;
  do {
    const result = (await r.scan(cursor, {
      match,
      count: SCAN_BATCH,
    })) as [string, string[]];
    const [nextCursor, keys] = result;
    total += Array.isArray(keys) ? keys.length : 0;
    cursor = nextCursor;
    if (cursor === "0") break;
  } while (true);
  return total;
}

async function countMatchingByPredicate<T>(
  match: string,
  predicate: (value: T) => boolean,
): Promise<number> {
  const r = redis();
  let cursor: string = "0";
  let total = 0;
  do {
    const result = (await r.scan(cursor, {
      match,
      count: SCAN_BATCH,
    })) as [string, string[]];
    const [nextCursor, keys] = result;
    if (Array.isArray(keys) && keys.length > 0) {
      const values = await Promise.all(
        keys.map(async (k) => {
          try {
            return await r.get<T>(k);
          } catch (err) {
            // Stats are best-effort; log and treat transient GET
            // failures as absent so the dashboard render survives.
            console.error("[dashboard-stats] get failed for", k, err);
            return null;
          }
        }),
      );
      for (const v of values) {
        if (v !== null && predicate(v)) total += 1;
      }
    }
    cursor = nextCursor;
    if (cursor === "0") break;
  } while (true);
  return total;
}

interface ActivationRecord {
  status?: string;
  last_heartbeat_at?: string;
}

interface LicenseRecord {
  status?: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const dayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [totalAccounts, activeAtelierLicenses, activationsLast24h] =
    await Promise.all([
      countMatching("dunamis:account:*"),
      countMatchingByPredicate<LicenseRecord>(
        "dunamis:atelier-license:*",
        (lic) => lic.status === "active",
      ),
      countMatchingByPredicate<ActivationRecord>(
        "dunamis:atelier-activation:*",
        (act) =>
          act.status === "active" &&
          typeof act.last_heartbeat_at === "string" &&
          act.last_heartbeat_at >= dayAgoIso,
      ),
    ]);

  return {
    totalAccounts,
    activeAtelierLicenses,
    activationsLast24h,
    openTickets: null,
    pendingDataExportsLast7d: null,
  };
}
