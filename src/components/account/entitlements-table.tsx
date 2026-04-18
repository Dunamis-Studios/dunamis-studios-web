"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Table, THead, TR, TH, TD, TBody } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PRODUCT_META, type Entitlement } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function EntitlementsTable({
  entitlements,
}: {
  entitlements: Entitlement[];
}) {
  const [query, setQuery] = React.useState("");
  const [productFilter, setProductFilter] = React.useState<"all" | "property-pulse" | "debrief">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | Entitlement["status"]>("all");

  const showFilters = entitlements.length > 5;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return entitlements.filter((e) => {
      if (productFilter !== "all" && e.product !== productFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.portalId.toLowerCase().includes(q) ||
        e.portalDomain.toLowerCase().includes(q) ||
        PRODUCT_META[e.product].name.toLowerCase().includes(q)
      );
    });
  }, [entitlements, query, productFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-5">
      {showFilters ? (
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-subtle)]"
              aria-hidden
            />
            <Input
              aria-label="Filter entitlements"
              placeholder="Filter by portal id, domain, or product…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Pills
            label="Product"
            value={productFilter}
            onChange={(v) => setProductFilter(v as typeof productFilter)}
            options={[
              { value: "all", label: "All" },
              { value: "property-pulse", label: "Property Pulse" },
              { value: "debrief", label: "Debrief" },
            ]}
          />
          <Pills
            label="Status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            options={[
              { value: "all", label: "All" },
              { value: "trial", label: "Trial" },
              { value: "active", label: "Active" },
              { value: "past_due", label: "Past due" },
              { value: "canceled", label: "Canceled" },
            ]}
          />
        </div>
      ) : null}

      <Table>
        <THead>
          <TR>
            <TH>App</TH>
            <TH>Portal</TH>
            <TH>Status</TH>
            <TH>Tier</TH>
            <TH>Created</TH>
            <TH>Renews</TH>
            <TH className="w-24"><span className="sr-only">Manage</span></TH>
          </TR>
        </THead>
        <TBody>
          {filtered.map((e) => (
            <TR key={e.entitlementId}>
              <TD>
                <div className="flex items-center gap-2.5 min-w-0">
                  <ProductDot product={e.product} />
                  <span className="font-medium truncate">
                    {PRODUCT_META[e.product].name}
                  </span>
                </div>
              </TD>
              <TD>
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-[var(--fg-subtle)]">
                    {e.portalId}
                  </span>
                  <span className="text-sm truncate max-w-[14rem]">
                    {e.portalDomain}
                  </span>
                </div>
              </TD>
              <TD><StatusBadge status={e.status} /></TD>
              <TD>
                {e.tier ? (
                  <Badge variant="neutral" className="capitalize">
                    {e.tier}
                  </Badge>
                ) : (
                  <span className="text-[var(--fg-subtle)]">—</span>
                )}
              </TD>
              <TD className="whitespace-nowrap text-[var(--fg-muted)]">
                {formatDate(e.createdAt)}
              </TD>
              <TD className="whitespace-nowrap text-[var(--fg-muted)]">
                {formatDate(e.renewalDate)}
              </TD>
              <TD className="text-right">
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  aria-label={`Manage ${PRODUCT_META[e.product].name} for portal ${e.portalId}`}
                >
                  <Link href={`/account/${e.product}/${e.portalId}`}>
                    Manage
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </TD>
            </TR>
          ))}
          {filtered.length === 0 ? (
            <TR>
              <TD colSpan={7}>
                <div className="py-10 text-center text-sm text-[var(--fg-muted)]">
                  No entitlements match these filters.
                </div>
              </TD>
            </TR>
          ) : null}
        </TBody>
      </Table>
    </div>
  );
}

function Pills<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-1"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-[5px] px-2.5 py-1 text-xs transition-colors",
            value === opt.value
              ? "bg-[var(--bg-muted)] text-[var(--fg)]"
              : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ProductDot({ product }: { product: Entitlement["product"] }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
        product === "property-pulse"
          ? "bg-[var(--color-pulse-500)]/15 text-[var(--color-pulse-500)]"
          : "bg-[var(--color-brief-500)]/15 text-[var(--color-brief-500)]",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}
