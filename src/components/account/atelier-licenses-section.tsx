import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Table, THead, TR, TH, TD, TBody } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { AtelierLicenseRecord } from "@/lib/atelier-license-signing";

/**
 * Dashboard panel for Atelier perpetual licenses, rendered beneath the
 * HubSpot entitlements table on /account. Atelier has no portal/renewal
 * dimension, so the column set differs from EntitlementsTable; the
 * shared shape is App / Status / Tier / Created / Renews / Manage. The
 * "Manage" link routes to /account/atelier-licenses for the dedicated
 * deactivate-and-rename surface — this dashboard panel is read-only.
 */
export function AtelierLicensesSection({
  licenses,
}: {
  licenses: AtelierLicenseRecord[];
}) {
  const sorted = [...licenses].sort((a, b) =>
    b.issued_at.localeCompare(a.issued_at),
  );
  return (
    <section aria-labelledby="atelier-section-heading" className="mt-12">
      <header className="mb-4">
        <h2
          id="atelier-section-heading"
          className="text-sm font-medium uppercase tracking-wider text-[var(--fg-subtle)]"
        >
          Software
        </h2>
      </header>
      <Table>
        <THead>
          <TR>
            <TH>App</TH>
            <TH>Status</TH>
            <TH>Tier</TH>
            <TH>Issued</TH>
            <TH>Renews</TH>
            <TH className="w-24"><span className="sr-only">Manage</span></TH>
          </TR>
        </THead>
        <TBody>
          {sorted.map((license) => (
            <TR key={license.lid}>
              <TD>
                <div className="flex items-center gap-2.5 min-w-0">
                  <AtelierDot />
                  <span className="font-medium truncate">Atelier</span>
                </div>
              </TD>
              <TD><StatusBadge status={license.status} /></TD>
              <TD>
                <Badge variant="neutral" className="capitalize">
                  {formatTier(license.tier)}
                </Badge>
              </TD>
              <TD className="whitespace-nowrap text-[var(--fg-muted)]">
                {formatDate(license.issued_at)}
              </TD>
              <TD className="whitespace-nowrap text-[var(--fg-muted)]">
                Perpetual
              </TD>
              <TD className="text-right">
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  aria-label={`Manage Atelier license ${license.lid}`}
                >
                  <Link href="/account/atelier-licenses">
                    Manage
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </section>
  );
}

function AtelierDot() {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_oklch,var(--color-atelier-500)_15%,transparent)] text-[var(--color-atelier-500)]"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}

function formatTier(tier: string): string {
  return tier
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
