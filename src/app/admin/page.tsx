import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  FileText,
  Ticket,
  KeyRound,
  ScrollText,
  Settings as SettingsIcon,
  ThumbsUp,
} from "lucide-react";

import { getCurrentAdminSession } from "@/lib/session";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";
import { readGlobalAuditFeed } from "@/lib/admin/audit-log";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · Dunamis Studios",
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

function formatDateHeader(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diffSec = Math.round((Date.now() - t) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h ago`;
  return `${Math.round(diffSec / 86400)}d ago`;
}

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    redirect("/login?redirect=/admin");
  }

  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(),
    readGlobalAuditFeed(20),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[var(--font-display)] text-3xl font-medium tracking-tight text-[var(--fg)]">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">{formatDateHeader()}</p>
      </header>

      <section aria-labelledby="quick-stats-heading">
        <h2
          id="quick-stats-heading"
          className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]"
        >
          Quick stats
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Customer accounts" value={stats.totalAccounts} />
          <StatTile
            label="Active Atelier licenses"
            value={stats.activeAtelierLicenses}
          />
          <StatTile
            label="Activations, last 24h"
            value={stats.activationsLast24h}
          />
          <StatTile
            label="Open tickets"
            value={stats.openTickets}
            placeholder="HubSpot integration pending"
          />
          <StatTile
            label="Pending data exports, 7d"
            value={stats.pendingDataExportsLast7d}
            placeholder="Sync export only"
          />
        </div>
      </section>

      <section aria-labelledby="navigation-heading">
        <h2
          id="navigation-heading"
          className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]"
        >
          Navigate
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NavCard
            href="/admin/customers"
            icon={<Users className="h-5 w-5" />}
            title="Customers"
            description="Search accounts, manage licenses, run support actions"
          />
          <NavCard
            href="/admin/content"
            icon={<FileText className="h-5 w-5" />}
            title="Content"
            description="Articles, guides, and KB authoring"
          />
          <NavCard
            href="/admin/licenses"
            icon={<KeyRound className="h-5 w-5" />}
            title="Licenses"
            description="Global Atelier license issuance"
          />
          <NavCard
            href="/admin/kb-feedback"
            icon={<ThumbsUp className="h-5 w-5" />}
            title="KB feedback"
            description="Per-article thumbs aggregation, highest down-rate first"
          />
          <NavCard
            icon={<Ticket className="h-5 w-5" />}
            title="Tickets"
            description="Support inbox (lands with HubSpot integration)"
            disabled
          />
          <NavCard
            icon={<ScrollText className="h-5 w-5" />}
            title="Audit log"
            description="Cross-account admin activity feed"
            disabled
          />
          <NavCard
            icon={<SettingsIcon className="h-5 w-5" />}
            title="Settings"
            description="Allowlist, feature flags, integrations"
            disabled
          />
        </div>
      </section>

      <section aria-labelledby="activity-heading">
        <h2
          id="activity-heading"
          className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--fg-subtle)]"
        >
          Recent activity
        </h2>
        {recentActivity.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-6 text-center text-sm text-[var(--fg-muted)]">
            No admin actions logged yet.
          </div>
        ) : (
          <ol className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
            {recentActivity.map((entry, idx) => (
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
                    {" → "}
                    <Link
                      href={`/admin/customers/${entry.account_id}`}
                      className="text-[var(--fg)] underline-offset-2 hover:underline"
                    >
                      {entry.account_id}
                    </Link>
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
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: number | null;
  placeholder?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
      <p className="text-xs text-[var(--fg-muted)]">{label}</p>
      <p className="mt-1 font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)]">
        {value === null ? (
          <span className="text-[var(--fg-subtle)]">n/a</span>
        ) : (
          value.toLocaleString()
        )}
      </p>
      {placeholder ? (
        <p className="mt-1 text-[10px] text-[var(--fg-subtle)]">{placeholder}</p>
      ) : null}
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  description,
  disabled,
}: {
  href?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  const content = (
    <div
      className={`flex h-full items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)]"
      }`}
    >
      <div className="mt-0.5 text-[var(--fg-muted)]">{icon}</div>
      <div className="min-w-0">
        <p className="font-medium text-[var(--fg)]">
          {title}
          {disabled ? (
            <span className="ml-2 text-[10px] font-normal uppercase tracking-wider text-[var(--fg-subtle)]">
              coming soon
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-[var(--fg-muted)]">{description}</p>
      </div>
    </div>
  );
  if (disabled || !href) {
    return <div aria-disabled>{content}</div>;
  }
  return <Link href={href}>{content}</Link>;
}
