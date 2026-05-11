import { getAccountById, getEntitlementsForAccount } from "./accounts";
import { listSessionsForAccount } from "./session";
import {
  listLicensesForAccountWithFallback,
  type AtelierLicenseRecord,
} from "./atelier-license-signing";
import {
  getActivationsForLicense,
  type AtelierActivation,
} from "./atelier-activation";
import {
  listEulaAcceptancesForLicense,
  type AtelierEulaAcceptanceRecord,
} from "./atelier-eula";
import type { Account, Entitlement, Session } from "./types";

/**
 * Shape returned to the customer when they request a data export from
 * the account portal. Everything Dunamis Studios stores that is keyed
 * to this customer's account (account record, sessions, entitlements,
 * Atelier licenses + activations + EULA acceptances). No HubSpot CRM
 * data is mirrored to Dunamis storage, so this export does not cover
 * data inside the customer's own HubSpot portals; the HubSpot
 * marketplace apps read CRM data on demand and do not retain it. The
 * customer can request a separate CRM export from HubSpot directly.
 */
export interface AccountDataExport {
  generated_at: string;
  format_version: "1";
  notes: string;
  account: Account | null;
  sessions: Session[];
  entitlements: Entitlement[];
  atelier: {
    licenses: AtelierLicenseRecord[];
    activations_by_license: Record<string, AtelierActivation[]>;
    eula_acceptances_by_license: Record<string, AtelierEulaAcceptanceRecord[]>;
  };
}

const EXPORT_NOTES = [
  "This export contains everything Dunamis Studios stores that is keyed",
  "to your Dunamis account. The Atelier desktop application stores",
  "wedding, vendor, guest, and business data in a local SQLite file on",
  "your own device; that data is not part of this export because Dunamis",
  "Studios never receives it. HubSpot CRM data accessed by Debrief or",
  "Property Pulse is read on demand from your HubSpot portal and is not",
  "retained by Dunamis Studios; request that export from HubSpot directly.",
].join(" ");

export async function buildAccountDataExport(
  accountId: string,
): Promise<AccountDataExport> {
  const account = await getAccountById(accountId);

  const [sessions, entitlements, licenses] = await Promise.all([
    listSessionsForAccount(accountId),
    getEntitlementsForAccount(accountId),
    account
      ? listLicensesForAccountWithFallback(accountId, account.email)
      : Promise.resolve([] as AtelierLicenseRecord[]),
  ]);

  const activations_by_license: Record<string, AtelierActivation[]> = {};
  const eula_acceptances_by_license: Record<
    string,
    AtelierEulaAcceptanceRecord[]
  > = {};

  await Promise.all(
    licenses.map(async (lic) => {
      const [activations, acceptances] = await Promise.all([
        getActivationsForLicense(lic.lid),
        listEulaAcceptancesForLicense(lic.lid),
      ]);
      activations_by_license[lic.lid] = activations;
      eula_acceptances_by_license[lic.lid] = acceptances;
    }),
  );

  return {
    generated_at: new Date().toISOString(),
    format_version: "1",
    notes: EXPORT_NOTES,
    account,
    sessions,
    entitlements,
    atelier: {
      licenses,
      activations_by_license,
      eula_acceptances_by_license,
    },
  };
}

export function dataExportFilename(accountEmail: string | undefined): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const safeEmail = (accountEmail ?? "account")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `dunamis-data-export-${safeEmail}-${stamp}.json`;
}
