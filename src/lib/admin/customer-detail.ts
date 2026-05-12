import { getAccountById } from "@/lib/accounts";
import {
  listLicensesForAccountWithFallback,
  type AtelierLicenseRecord,
} from "@/lib/atelier-license-signing";
import {
  getActivationsForLicense,
  type AtelierActivation,
} from "@/lib/atelier-activation";
import {
  listEulaAcceptancesForLicense,
  type AtelierEulaAcceptanceRecord,
} from "@/lib/atelier-eula";
import {
  readAccountAuditLog,
  countAccountAuditLog,
  type AdminActionLogEntry,
} from "@/lib/admin/audit-log";
import { listSessionsForAccount } from "@/lib/session";
import type { Account } from "@/lib/types";

/**
 * Aggregator for the /admin/customers/[account_id] detail page.
 *
 * Pulls every record the page renders in one server-side call so the
 * page is a pure server component with no client-side data fetching
 * on initial load. The action handlers in PR 3 fire from inline
 * client subcomponents that refresh via router.refresh() rather than
 * by re-fetching this aggregate.
 */

export interface CustomerDetail {
  account: Account;
  /** Most recent session createdAt, or null if no sessions on file. */
  lastLoginAt: string | null;
  licenses: AtelierLicenseRecord[];
  /** Map from lid -> activation records, including deactivated. */
  activationsByLid: Record<string, AtelierActivation[]>;
  /** Map from lid -> EULA acceptance records, newest first. */
  eulaAcceptancesByLid: Record<string, AtelierEulaAcceptanceRecord[]>;
  recentAuditLog: AdminActionLogEntry[];
  totalAuditLogEntries: number;
}

export async function loadCustomerDetail(
  accountId: string,
): Promise<CustomerDetail | null> {
  const account = await getAccountById(accountId);
  if (!account) return null;

  const [licenses, sessions, recentAuditLog, totalAuditLogEntries] =
    await Promise.all([
      listLicensesForAccountWithFallback(accountId, account.email),
      listSessionsForAccount(accountId),
      readAccountAuditLog(accountId, 0, 20),
      countAccountAuditLog(accountId),
    ]);

  // Sessions are sorted desc by createdAt inside listSessionsForAccount.
  const lastLoginAt = sessions[0]?.createdAt ?? null;

  const activationsByLid: Record<string, AtelierActivation[]> = {};
  const eulaAcceptancesByLid: Record<
    string,
    AtelierEulaAcceptanceRecord[]
  > = {};

  await Promise.all(
    licenses.map(async (lic) => {
      const [activations, eula] = await Promise.all([
        getActivationsForLicense(lic.lid),
        listEulaAcceptancesForLicense(lic.lid),
      ]);
      activationsByLid[lic.lid] = activations;
      eulaAcceptancesByLid[lic.lid] = eula;
    }),
  );

  return {
    account,
    lastLoginAt,
    licenses,
    activationsByLid,
    eulaAcceptancesByLid,
    recentAuditLog,
    totalAuditLogEntries,
  };
}
