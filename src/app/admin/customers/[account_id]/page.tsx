import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentAdminSession } from "@/lib/session";
import { loadCustomerDetail } from "@/lib/admin/customer-detail";
import type {
  AtelierLicenseRecord,
} from "@/lib/atelier-license-signing";
import type { AtelierActivation } from "@/lib/atelier-activation";
import type { AtelierEulaAcceptanceRecord } from "@/lib/atelier-eula";
import type { AdminActionLogEntry } from "@/lib/admin/audit-log";
import { AccountIdCopyButton } from "@/components/admin/account-id-copy-button";
import { CopyableId } from "@/components/admin/copyable-id";
import { CustomerActionsMenu } from "@/components/admin/customer-actions-menu";
import { LicenseRowActions } from "@/components/admin/license-row-actions";
import { ActivationRowActions } from "@/components/admin/activation-row-actions";
import { LocalTime } from "@/components/admin/local-time";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customer · Admin · Dunamis Studios",
  robots: { index: false, follow: false },
};

const ACTION_LABELS: Record<string, string> = {
  deactivate_device: "Deactivated device",
  revoke_license: "Revoked license",
  resend_license_email: "Resent license email",
  update_account_profile: "Updated profile",
  delete_account: "Deleted account",
  trigger_data_export: "Triggered data export",
  refresh_from_stripe: "Refreshed from Stripe",
  set_refund_flag: "Set refund flag",
};

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diffSec = Math.round((Date.now() - t) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
  return `${Math.round(diffSec / 86400)}d ago`;
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "active":
      return "bg-[color-mix(in_oklch,var(--color-success-500,#10b981)_15%,transparent)] text-[var(--color-success-700,#047857)] dark:text-[#6ee7b7]";
    case "refunded":
      return "bg-[color-mix(in_oklch,var(--fg-subtle)_15%,transparent)] text-[var(--fg-muted)]";
    case "revoked":
      return "bg-[color-mix(in_oklch,var(--color-danger-500,#ef4444)_15%,transparent)] text-[var(--color-danger-700,#991b1b)] dark:text-[#fca5a5]";
    case "deactivated":
      return "bg-[var(--bg-muted)] text-[var(--fg-muted)]";
    default:
      return "bg-[var(--bg-muted)] text-[var(--fg-muted)]";
  }
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ account_id: string }>;
}) {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    redirect("/login?redirect=/admin/customers");
  }

  const { account_id } = await params;
  const detail = await loadCustomerDetail(account_id);
  if (!detail) notFound();

  const fullName =
    [detail.account.firstName, detail.account.lastName]
      .filter((v) => typeof v === "string" && v.length > 0)
      .join(" ") || "no name on file";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-[var(--fg-subtle)]">
          <Link href="/admin/customers" className="hover:text-[var(--fg)]">
            Customers
          </Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--fg-muted)]">{detail.account.email}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-[var(--font-display)] text-3xl font-medium tracking-tight text-[var(--fg)]">
              {fullName}
            </h1>
            <p className="mt-1 text-sm text-[var(--fg)]">
              {detail.account.email}
              {detail.account.companyName ? (
                <span className="text-[var(--fg-muted)]">
                  {" · "}
                  {detail.account.companyName}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-[var(--fg-subtle)]">
              Created <LocalTime iso={detail.account.createdAt} />
              {" · "}
              Last sign-in <LocalTime iso={detail.lastLoginAt} />
            </p>
            <AccountIdCopyButton accountId={detail.account.accountId} />
          </div>
          <div className="shrink-0">
            <CustomerActionsMenu
              accountId={detail.account.accountId}
              accountEmail={detail.account.email}
              firstName={detail.account.firstName}
              lastName={detail.account.lastName}
              companyName={detail.account.companyName ?? null}
            />
          </div>
        </div>
      </header>

      <LicensesSection
        accountId={detail.account.accountId}
        licenses={detail.licenses}
      />
      <ActivationsSection
        accountId={detail.account.accountId}
        licenses={detail.licenses}
        activationsByLid={detail.activationsByLid}
      />
      <EulaAcceptancesSection
        licenses={detail.licenses}
        eulaByLid={detail.eulaAcceptancesByLid}
      />
      <DataExportsSection />
      <VerificationKeysSection />
      <ActivityLogSection
        entries={detail.recentAuditLog}
        total={detail.totalAuditLogEntries}
      />
    </div>
  );
}

function SectionHeader({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-3">
      <h2
        id={id}
        className="font-[var(--font-display)] text-lg font-medium text-[var(--fg)]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-0.5 text-xs text-[var(--fg-muted)]">{description}</p>
      ) : null}
    </header>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center text-sm text-[var(--fg-muted)]">
      {children}
    </div>
  );
}

function LicensesSection({
  accountId,
  licenses,
}: {
  accountId: string;
  licenses: AtelierLicenseRecord[];
}) {
  return (
    <section aria-labelledby="licenses-heading">
      <SectionHeader
        id="licenses-heading"
        title="Licenses"
        description="Every license this account owns, including refunded and revoked records."
      />
      {licenses.length === 0 ? (
        <EmptyState>No licenses on this account.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
                <th className="px-4 py-2 font-medium">License ID</th>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Version cap</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Issued</th>
                <th className="px-4 py-2 font-medium">Stripe payment</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {licenses.map((lic) => (
                <tr key={lic.lid}>
                  <td className="px-4 py-3">
                    <CopyableId value={lic.lid} />
                  </td>
                  <td className="px-4 py-3 text-[var(--fg)]">{lic.product}</td>
                  <td className="px-4 py-3 text-[var(--fg)]">
                    v{lic.version_major}.x
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(lic.status)}`}
                    >
                      {lic.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-muted)]">
                    <LocalTime iso={lic.issued_at} variant="short" />
                  </td>
                  <td className="px-4 py-3">
                    {lic.stripe_payment_intent_id ? (
                      <CopyableId value={lic.stripe_payment_intent_id} />
                    ) : (
                      <span className="font-mono text-xs text-[var(--fg-subtle)]">
                        n/a
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <LicenseRowActions
                      accountId={accountId}
                      lid={lic.lid}
                      status={lic.status}
                      product={lic.product}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ActivationsSection({
  accountId,
  licenses,
  activationsByLid,
}: {
  accountId: string;
  licenses: AtelierLicenseRecord[];
  activationsByLid: Record<string, AtelierActivation[]>;
}) {
  return (
    <section aria-labelledby="activations-heading">
      <SectionHeader
        id="activations-heading"
        title="Activations"
        description="Devices that have activated against this customer's licenses, grouped by license."
      />
      {licenses.length === 0 ? (
        <EmptyState>No licenses, so no activations.</EmptyState>
      ) : (
        <div className="space-y-3">
          {licenses.map((lic) => {
            const acts = activationsByLid[lic.lid] ?? [];
            return (
              <div
                key={lic.lid}
                className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]"
              >
                <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2 text-xs text-[var(--fg-muted)]">
                  <span>License</span>
                  <CopyableId value={lic.lid} />
                </div>
                {acts.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-[var(--fg-muted)]">
                    No active devices.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
                        <th className="px-4 py-2 font-medium">Device</th>
                        <th className="px-4 py-2 font-medium">Activation ID</th>
                        <th className="px-4 py-2 font-medium">Atelier ver</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">First</th>
                        <th className="px-4 py-2 font-medium">Last seen</th>
                        <th className="px-4 py-2 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {acts.map((act) => (
                        <tr key={act.activation_id}>
                          <td className="px-4 py-3 text-[var(--fg)]">
                            {act.device_label}
                          </td>
                          <td className="px-4 py-3">
                            <CopyableId value={act.activation_id} />
                          </td>
                          <td className="px-4 py-3 text-[var(--fg-muted)]">
                            {act.atelier_version}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(act.status)}`}
                            >
                              {act.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--fg-muted)]">
                            <LocalTime
                              iso={act.first_activated_at}
                              variant="short"
                            />
                          </td>
                          <td
                            className="px-4 py-3 text-[var(--fg-muted)]"
                            title={act.last_heartbeat_at}
                          >
                            {formatRelative(act.last_heartbeat_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ActivationRowActions
                              accountId={accountId}
                              activationId={act.activation_id}
                              deviceLabel={act.device_label}
                              status={act.status}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EulaAcceptancesSection({
  licenses,
  eulaByLid,
}: {
  licenses: AtelierLicenseRecord[];
  eulaByLid: Record<string, AtelierEulaAcceptanceRecord[]>;
}) {
  const allRecords = licenses.flatMap((lic) => eulaByLid[lic.lid] ?? []);
  return (
    <section aria-labelledby="eula-heading">
      <SectionHeader
        id="eula-heading"
        title="EULA acceptances"
        description="Every personalized EULA the customer accepted, across every license on this account."
      />
      {allRecords.length === 0 ? (
        <EmptyState>No EULA acceptances recorded.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--fg-subtle)]">
                <th className="px-4 py-2 font-medium">EULA version</th>
                <th className="px-4 py-2 font-medium">License</th>
                <th className="px-4 py-2 font-medium">Accepted</th>
                <th className="px-4 py-2 font-medium">Atelier ver</th>
                <th className="px-4 py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {allRecords.map((rec) => (
                <tr key={`${rec.lid}:${rec.eula_version}`}>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--fg)]">
                    {rec.eula_version}
                  </td>
                  <td className="px-4 py-3">
                    <CopyableId value={rec.lid} />
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-muted)]">
                    <LocalTime iso={rec.accepted_at} />
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-muted)]">
                    {rec.atelier_version}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--fg-muted)]">
                    {rec.ip_at_accept ?? (
                      <span className="text-[var(--fg-subtle)]">n/a</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function DataExportsSection() {
  return (
    <section aria-labelledby="exports-heading">
      <SectionHeader
        id="exports-heading"
        title="Data export history"
        description="Customer-initiated and admin-initiated exports against this account."
      />
      <EmptyState>
        Data export history tracking lands with the read-write action
        slice. Today the customer-facing export endpoint streams the
        JSON synchronously; no per-request log exists yet.
      </EmptyState>
    </section>
  );
}

function VerificationKeysSection() {
  return (
    <section aria-labelledby="verification-heading">
      <SectionHeader
        id="verification-heading"
        title="Verification keys"
        description="Customer identity-confirmation tokens used during support flows."
      />
      <EmptyState>
        Verification key tool not yet built. Coming in the next slice.
      </EmptyState>
    </section>
  );
}

function ActivityLogSection({
  entries,
  total,
}: {
  entries: AdminActionLogEntry[];
  total: number;
}) {
  return (
    <section aria-labelledby="activity-heading">
      <SectionHeader
        id="activity-heading"
        title="Activity log"
        description={`Admin actions taken against this account. ${total} total ${total === 1 ? "entry" : "entries"}.`}
      />
      {entries.length === 0 ? (
        <EmptyState>No admin actions on this account yet.</EmptyState>
      ) : (
        <ol className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
          {entries.map((entry, idx) => (
            <li
              key={`${entry.timestamp}-${idx}`}
              className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[var(--fg)]">
                  <span className="font-medium">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                  {entry.result === "failure" ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-[var(--color-danger-bg,#fee2e2)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-danger-fg,#991b1b)] dark:bg-[#3a1010] dark:text-[#fca5a5]">
                      failed
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                  <span className="font-medium">{entry.admin_email}</span>
                  {entry.error_message ? (
                    <span className="ml-2 italic">{entry.error_message}</span>
                  ) : null}
                </p>
              </div>
              <time
                className="shrink-0 text-xs text-[var(--fg-subtle)]"
                dateTime={entry.timestamp}
                title={entry.timestamp}
              >
                {formatRelative(entry.timestamp)}
              </time>
            </li>
          ))}
        </ol>
      )}
      {total > entries.length ? (
        <p className="mt-2 text-xs text-[var(--fg-subtle)]">
          Pagination beyond the first 20 entries lands with the read-write
          action slice.
        </p>
      ) : null}
    </section>
  );
}
