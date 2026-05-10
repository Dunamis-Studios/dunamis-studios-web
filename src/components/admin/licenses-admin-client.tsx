"use client";

import * as React from "react";
import {
  Copy,
  Check as CheckIcon,
  RefreshCw,
  Ban,
  Send,
  ScrollText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  AtelierLicenseRecord,
  AtelierLicenseStatus,
  AtelierRevocationMode,
} from "@/lib/atelier-license-signing";

interface Props {
  initialLicenses: AtelierLicenseRecord[];
  adminEmail: string;
}

type StatusFilter = "all" | AtelierLicenseStatus;

type IssueState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | {
      kind: "success";
      license: string;
      lid: string;
      emailSent: boolean;
      emailError: string | null;
    }
  | { kind: "error"; message: string };

interface ResolvedAccount {
  accountId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
}

type AccountLookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; account: ResolvedAccount }
  | { kind: "missing" }
  | { kind: "error"; message: string };

interface EulaAcceptanceRow {
  lid: string;
  account_id: string;
  eula_version: string;
  accepted_at: string;
  atelier_version: string;
  email_at_accept: string;
  first_name_at_accept: string;
  last_name_at_accept: string;
  company_name_at_accept: string | null;
  ip_at_accept: string | null;
  user_agent_at_accept: string | null;
}

type EulaHistoryState =
  | { kind: "loading" }
  | {
      kind: "loaded";
      acceptances: EulaAcceptanceRow[];
    }
  | { kind: "error"; message: string };

const STATUS_BADGE: Record<AtelierLicenseStatus, "success" | "warning" | "danger"> = {
  active: "success",
  refunded: "warning",
  revoked: "danger",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

export function LicensesAdminClient({ initialLicenses, adminEmail }: Props) {
  const [licenses, setLicenses] = React.useState(initialLicenses);
  const [issueState, setIssueState] = React.useState<IssueState>({ kind: "idle" });
  const [issueEmail, setIssueEmail] = React.useState("");
  const [accountLookup, setAccountLookup] = React.useState<AccountLookupState>({
    kind: "idle",
  });
  const [issueVersionMajor, setIssueVersionMajor] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [searchEmail, setSearchEmail] = React.useState("");
  const [actionRowId, setActionRowId] = React.useState<string | null>(null);
  const [copiedLid, setCopiedLid] = React.useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] =
    React.useState<AtelierLicenseRecord | null>(null);
  const [revokeMode, setRevokeMode] =
    React.useState<AtelierRevocationMode>("grace_14d");
  const [revokeReason, setRevokeReason] = React.useState("");
  const [revokeBusy, setRevokeBusy] = React.useState(false);
  const [revokeError, setRevokeError] = React.useState<string | null>(null);
  const [eulaTarget, setEulaTarget] =
    React.useState<AtelierLicenseRecord | null>(null);
  const [eulaHistory, setEulaHistory] = React.useState<EulaHistoryState>({
    kind: "loading",
  });

  const filtered = React.useMemo(() => {
    return licenses.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (
        searchEmail.trim() &&
        !l.email.toLowerCase().includes(searchEmail.toLowerCase().trim())
      ) {
        return false;
      }
      return true;
    });
  }, [licenses, statusFilter, searchEmail]);

  async function onLookupAccount() {
    const trimmed = issueEmail.trim().toLowerCase();
    if (!trimmed) {
      setAccountLookup({ kind: "idle" });
      return;
    }
    setAccountLookup({ kind: "loading" });
    try {
      const res = await fetch(
        `/api/admin/lookup-account?email=${encodeURIComponent(trimmed)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setAccountLookup({
          kind: "error",
          message: data?.error ?? "Lookup failed.",
        });
        return;
      }
      if (!data.found) {
        setAccountLookup({ kind: "missing" });
        return;
      }
      setAccountLookup({ kind: "found", account: data.account });
      // Snap the email field to the canonical account email so issuance
      // and the account record agree byte-for-byte (the lookup
      // lowercases and trims; reflect that back into the input).
      setIssueEmail(data.account.email);
    } catch (err) {
      setAccountLookup({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error.",
      });
    }
  }

  async function onIssueSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (issueState.kind === "submitting") return;
    if (accountLookup.kind !== "found") {
      // Belt-and-suspenders — the submit button is disabled until a
      // resolved account is in hand, but if a quick-clicker beats the
      // disabled state we surface the same message inline.
      setIssueState({
        kind: "error",
        message: "Resolve a Dunamis account before issuing.",
      });
      return;
    }
    const account = accountLookup.account;
    setIssueState({ kind: "submitting" });
    try {
      const res = await fetch("/api/admin/issue-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account.email,
          account_id: account.accountId,
          product: "atelier",
          version_major: issueVersionMajor,
          tier: "self-serve",
          // Pull the customer's first name straight off the resolved
          // account so the email greeting is correct without an
          // admin-typed copy. Falls back to undefined if the account
          // didn't capture one (legacy records pre-firstName field
          // shouldn't exist, but the type is permissive).
          first_name: account.firstName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIssueState({ kind: "error", message: data?.error ?? "Issuance failed." });
        return;
      }
      setIssueState({
        kind: "success",
        license: data.license,
        lid: data.lid,
        emailSent: data.email_sent,
        emailError: data.email_error,
      });
      // Optimistically prepend the new record to the table.
      setLicenses((prev) => [data.record, ...prev]);
      setIssueEmail("");
      setAccountLookup({ kind: "idle" });
    } catch (err) {
      setIssueState({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error.",
      });
    }
  }

  async function onResend(lid: string) {
    setActionRowId(lid);
    try {
      const res = await fetch("/api/admin/resend-license-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lid }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "Resend failed.");
        return;
      }
      alert(`Sent to ${data.email}.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Network error.");
    } finally {
      setActionRowId(null);
    }
  }

  async function onSetStatus(lid: string, status: AtelierLicenseStatus) {
    if (status === "revoked") {
      // Revocation has more knobs (mode + reason) — open the modal
      // instead of firing the request straight from the table action.
      const target = licenses.find((l) => l.lid === lid) ?? null;
      if (!target) return;
      setRevokeTarget(target);
      setRevokeMode("grace_14d");
      setRevokeReason("");
      setRevokeError(null);
      return;
    }
    if (!confirm(`Mark this license as "${status}"? The license string remains cryptographically valid; this just records the administrative state.`)) {
      return;
    }
    setActionRowId(lid);
    try {
      const res = await fetch("/api/admin/license-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lid, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "Status update failed.");
        return;
      }
      setLicenses((prev) =>
        prev.map((l) => (l.lid === lid ? data.record : l)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Network error.");
    } finally {
      setActionRowId(null);
    }
  }

  async function onConfirmRevocation() {
    if (!revokeTarget) return;
    setRevokeBusy(true);
    setRevokeError(null);
    try {
      const res = await fetch("/api/admin/license-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lid: revokeTarget.lid,
          status: "revoked",
          revocation_mode: revokeMode,
          revocation_reason: revokeReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRevokeError(data?.error ?? "Status update failed.");
        return;
      }
      setLicenses((prev) =>
        prev.map((l) => (l.lid === revokeTarget.lid ? data.record : l)),
      );
      setRevokeTarget(null);
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setRevokeBusy(false);
    }
  }

  async function onOpenEulaHistory(license: AtelierLicenseRecord) {
    setEulaTarget(license);
    setEulaHistory({ kind: "loading" });
    try {
      const res = await fetch(
        `/api/admin/eula-acceptances/${encodeURIComponent(license.lid)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setEulaHistory({
          kind: "error",
          message: data?.error ?? "Lookup failed.",
        });
        return;
      }
      setEulaHistory({
        kind: "loaded",
        acceptances: data.acceptances as EulaAcceptanceRow[],
      });
    } catch (err) {
      setEulaHistory({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error.",
      });
    }
  }

  async function onCopyLicense(lid: string, license: string) {
    try {
      await navigator.clipboard.writeText(license);
      setCopiedLid(lid);
      setTimeout(() => setCopiedLid((curr) => (curr === lid ? null : curr)), 2000);
    } catch {
      alert("Copy failed. The license string is in the table cell — copy it manually.");
    }
  }

  return (
    <div className="space-y-10">
      {/* Issuance form */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8">
        <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
          Issue a new license
        </h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Signed and persisted with your admin email recorded as
          issuer (<code className="rounded bg-[var(--bg-muted)] px-1 text-xs">{adminEmail}</code>).
        </p>

        <form onSubmit={onIssueSubmit} className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="issue-email">Find Dunamis account by email</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="issue-email"
                type="email"
                required
                value={issueEmail}
                onChange={(e) => {
                  setIssueEmail(e.target.value);
                  // Any edit invalidates the resolved account — the
                  // picker must re-resolve before issuance can proceed.
                  if (accountLookup.kind !== "idle") {
                    setAccountLookup({ kind: "idle" });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void onLookupAccount();
                  }
                }}
                disabled={
                  issueState.kind === "submitting" ||
                  accountLookup.kind === "loading"
                }
                placeholder="customer@example.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => void onLookupAccount()}
                disabled={
                  !issueEmail.trim() ||
                  issueState.kind === "submitting" ||
                  accountLookup.kind === "loading"
                }
              >
                {accountLookup.kind === "loading" ? "Finding…" : "Find account"}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-[var(--fg-subtle)]">
              Every license must bind to an existing Dunamis Studios account.
              If the customer hasn&apos;t signed up yet, send them to{" "}
              <code className="rounded bg-[var(--bg-muted)] px-1 text-[10px]">
                /signup
              </code>{" "}
              first.
            </p>
          </div>
          <div>
            <Label htmlFor="issue-major">Major version</Label>
            <Input
              id="issue-major"
              type="number"
              min={1}
              max={99}
              value={issueVersionMajor}
              onChange={(e) => setIssueVersionMajor(Number(e.target.value))}
              disabled={issueState.kind === "submitting"}
              className="mt-1.5"
            />
          </div>

          {/* Resolved account chip / lookup feedback */}
          {accountLookup.kind === "found" ? (
            <div className="sm:col-span-3 rounded-md border border-[var(--color-success)]/40 bg-[color-mix(in_oklch,var(--color-success)_8%,var(--bg-elevated))] p-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-[var(--fg)]">
                <CheckIcon
                  className="h-4 w-4 text-[var(--color-success)]"
                  aria-hidden
                />
                {accountLookup.account.firstName}{" "}
                {accountLookup.account.lastName}
                {accountLookup.account.companyName ? (
                  <span className="font-normal text-[var(--fg-muted)]">
                    · {accountLookup.account.companyName}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 grid gap-1 text-xs text-[var(--fg-muted)] sm:grid-cols-2">
                <div>
                  Email:{" "}
                  <code className="rounded bg-[var(--bg-muted)] px-1 text-[11px]">
                    {accountLookup.account.email}
                  </code>
                </div>
                <div>
                  Account id:{" "}
                  <code className="rounded bg-[var(--bg-muted)] px-1 text-[11px]">
                    {accountLookup.account.accountId}
                  </code>
                </div>
              </div>
            </div>
          ) : null}

          {accountLookup.kind === "missing" ? (
            <div
              role="alert"
              className="sm:col-span-3 rounded-md border border-[var(--color-warning)]/40 bg-[color-mix(in_oklch,var(--color-warning)_8%,var(--bg-elevated))] p-3 text-sm text-[var(--fg)]"
            >
              <div className="font-medium">No Dunamis account exists for that email.</div>
              <p className="mt-1 text-xs text-[var(--fg-muted)]">
                Have the customer sign up at{" "}
                <code className="rounded bg-[var(--bg-muted)] px-1 text-[11px]">
                  /signup
                </code>
                , then come back and re-resolve. Issuance is gated on a
                resolved account so the license binds to the same id the
                customer portal uses.
              </p>
            </div>
          ) : null}

          {accountLookup.kind === "error" ? (
            <p
              role="alert"
              className="sm:col-span-3 rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_8%,var(--bg-elevated))] p-3 text-sm text-[var(--color-danger)]"
            >
              {accountLookup.message}
            </p>
          ) : null}

          <div className="sm:col-span-3 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--fg-subtle)]">
              Product: atelier · Tier: self-serve
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={
                issueState.kind === "submitting" ||
                accountLookup.kind !== "found"
              }
            >
              {issueState.kind === "submitting" ? "Issuing…" : "Issue license"}
            </Button>
          </div>
        </form>

        {issueState.kind === "success" ? (
          <div className="mt-6 rounded-xl border border-[var(--color-success)]/40 bg-[color-mix(in_oklch,var(--color-success)_8%,var(--bg-elevated))] p-4">
            <div className="flex items-start gap-2 text-sm font-medium text-[var(--fg)]">
              <CheckIcon className="mt-0.5 h-4 w-4 text-[var(--color-success)]" aria-hidden />
              {issueState.emailSent
                ? `Issued and emailed. lid: ${issueState.lid}`
                : `Issued, but email failed. lid: ${issueState.lid}`}
            </div>
            {issueState.emailError ? (
              <p className="mt-1 text-xs text-[var(--color-danger)]">
                Email error: {issueState.emailError}
              </p>
            ) : null}
            <div className="mt-3 flex items-start gap-2">
              <code className="block max-w-full flex-1 overflow-x-auto rounded bg-[var(--bg-muted)] p-2 font-mono text-[11px] text-[var(--fg)]">
                {issueState.license}
              </code>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onCopyLicense(issueState.lid, issueState.license)}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                {copiedLid === issueState.lid ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : null}

        {issueState.kind === "error" ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_8%,var(--bg-elevated))] p-3 text-sm text-[var(--color-danger)]"
          >
            {issueState.message}
          </p>
        ) : null}
      </section>

      {/* Licenses table */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
              Issued licenses
            </h2>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              {licenses.length} total · {filtered.length} matching
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <Label htmlFor="filter-status" className="text-xs">
                Status
              </Label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="mt-1 h-10 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--fg)] outline-none focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="refunded">Refunded</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
            <div className="sm:w-64">
              <Label htmlFor="filter-search" className="text-xs">
                Search by email
              </Label>
              <Input
                id="filter-search"
                type="search"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="customer@…"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              <tr>
                <th className="px-3 py-2">Issued</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Major</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Issued by</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-[var(--fg-muted)]">
                    No licenses match. Issue a new one above, or relax the filters.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.lid} className="hover:bg-[var(--bg-subtle)]">
                    <td className="px-3 py-2 font-mono text-xs text-[var(--fg-muted)]">
                      {formatDate(l.issued_at)}
                    </td>
                    <td className="px-3 py-2 text-[var(--fg)]">{l.email}</td>
                    <td className="px-3 py-2 text-[var(--fg-muted)]">{l.tier}</td>
                    <td className="px-3 py-2 text-[var(--fg-muted)]">v{l.version_major}</td>
                    <td className="px-3 py-2">
                      <Badge variant={STATUS_BADGE[l.status]} className="capitalize">
                        {l.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--fg-subtle)]">
                      {l.issued_by_admin_email ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onCopyLicense(l.lid, l.key_string)}
                          title="Copy license string"
                          className={cn(
                            "rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]",
                            copiedLid === l.lid && "text-[var(--color-success)]",
                          )}
                        >
                          {copiedLid === l.lid ? (
                            <CheckIcon className="h-4 w-4" aria-hidden />
                          ) : (
                            <Copy className="h-4 w-4" aria-hidden />
                          )}
                          <span className="sr-only">Copy license</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onResend(l.lid)}
                          disabled={actionRowId === l.lid}
                          title="Resend license email"
                          className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)] disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" aria-hidden />
                          <span className="sr-only">Resend email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEulaHistory(l)}
                          title="View EULA acceptance history"
                          className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]"
                        >
                          <ScrollText className="h-4 w-4" aria-hidden />
                          <span className="sr-only">EULA history</span>
                        </button>
                        {l.status === "active" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onSetStatus(l.lid, "refunded")}
                              disabled={actionRowId === l.lid}
                              title="Mark refunded"
                              className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-warning)] disabled:opacity-50"
                            >
                              <RefreshCw className="h-4 w-4" aria-hidden />
                              <span className="sr-only">Mark refunded</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onSetStatus(l.lid, "revoked")}
                              disabled={actionRowId === l.lid}
                              title="Mark revoked"
                              className="rounded-md p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--color-danger)] disabled:opacity-50"
                            >
                              <Ban className="h-4 w-4" aria-hidden />
                              <span className="sr-only">Mark revoked</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={revokeTarget != null}
        onOpenChange={(open) => {
          if (!open && !revokeBusy) setRevokeTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke license</DialogTitle>
            <DialogDescription>
              Choose how aggressively the lockdown takes effect. Most refund-
              driven revocations leave the customer the 14-day grace window;
              breach-driven revocations should lock immediately.
            </DialogDescription>
          </DialogHeader>

          {revokeTarget ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs">
                <div className="font-medium text-[var(--fg)]">
                  {revokeTarget.email}
                </div>
                <div className="font-mono text-[var(--fg-subtle)]">
                  {revokeTarget.lid}
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-[var(--fg)]">
                  Lockdown mode
                </legend>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-[var(--border)] p-3">
                  <input
                    type="radio"
                    name="revoke-mode"
                    value="grace_14d"
                    checked={revokeMode === "grace_14d"}
                    onChange={() => setRevokeMode("grace_14d")}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-medium text-[var(--fg)]">
                      14-day grace period{" "}
                      <span className="font-normal text-[var(--fg-subtle)]">
                        (default)
                      </span>
                    </span>
                    <span className="text-xs text-[var(--fg-muted)]">
                      Activate and heartbeat return a soft warning. The client
                      keeps running until the heartbeat hits a revoked license
                      14 days after the revocation timestamp.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded-md border border-[var(--border)] p-3">
                  <input
                    type="radio"
                    name="revoke-mode"
                    value="immediate"
                    checked={revokeMode === "immediate"}
                    onChange={() => setRevokeMode("immediate")}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-medium text-[var(--fg)]">
                      Lock immediately
                    </span>
                    <span className="text-xs text-[var(--fg-muted)]">
                      Next activate or heartbeat returns a hard revoked
                      response and the client locks instantly. Use for breach,
                      fraud, or legal-driven revocations.
                    </span>
                  </span>
                </label>
              </fieldset>

              <div>
                <Label htmlFor="revoke-reason" className="text-sm">
                  Reason{" "}
                  <span className="font-normal text-[var(--fg-subtle)]">
                    (admin-only, not shown to customer)
                  </span>
                </Label>
                <textarea
                  id="revoke-reason"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="e.g., Stripe refund #ch_xxx; or breach of EULA §5"
                  className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--border-strong)]"
                />
              </div>

              {revokeError ? (
                <p className="text-sm text-[var(--color-danger)]">
                  {revokeError}
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRevokeTarget(null)}
              disabled={revokeBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmRevocation}
              disabled={revokeBusy}
              className="bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90"
            >
              {revokeBusy ? "Revoking…" : "Revoke license"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={eulaTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setEulaTarget(null);
            setEulaHistory({ kind: "loading" });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>EULA acceptance history</DialogTitle>
            <DialogDescription>
              Every server-recorded EULA acceptance event for this license.
              Records are append-only — version bumps add a new row alongside
              the older one.
            </DialogDescription>
          </DialogHeader>

          {eulaTarget ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs">
                <div className="font-medium text-[var(--fg)]">
                  {eulaTarget.email}
                </div>
                <div className="font-mono text-[var(--fg-subtle)]">
                  {eulaTarget.lid}
                </div>
              </div>

              {eulaHistory.kind === "loading" ? (
                <p className="text-sm text-[var(--fg-muted)]">Loading…</p>
              ) : null}

              {eulaHistory.kind === "error" ? (
                <p
                  role="alert"
                  className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_8%,var(--bg-elevated))] p-3 text-sm text-[var(--color-danger)]"
                >
                  {eulaHistory.message}
                </p>
              ) : null}

              {eulaHistory.kind === "loaded" ? (
                eulaHistory.acceptances.length === 0 ? (
                  <p className="rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-sm text-[var(--fg-muted)]">
                    No EULA acceptance records yet. Either the customer
                    hasn&apos;t completed onboarding, or this license predates
                    server-side acceptance recording.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {eulaHistory.acceptances.map((a) => (
                      <li
                        key={`${a.lid}:${a.eula_version}`}
                        className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-[var(--fg)]">
                            EULA v{a.eula_version}
                          </div>
                          <div className="font-mono text-[var(--fg-subtle)]">
                            {a.accepted_at}
                          </div>
                        </div>
                        <div className="mt-2 grid gap-1 sm:grid-cols-2">
                          <div className="text-[var(--fg-muted)]">
                            Accepted as:{" "}
                            <span className="text-[var(--fg)]">
                              {a.first_name_at_accept} {a.last_name_at_accept}
                              {a.company_name_at_accept
                                ? ` · ${a.company_name_at_accept}`
                                : ""}
                            </span>
                          </div>
                          <div className="text-[var(--fg-muted)]">
                            Email at accept:{" "}
                            <code className="rounded bg-[var(--bg-muted)] px-1 text-[11px]">
                              {a.email_at_accept}
                            </code>
                          </div>
                          <div className="text-[var(--fg-muted)]">
                            Atelier version:{" "}
                            <code className="rounded bg-[var(--bg-muted)] px-1 text-[11px]">
                              {a.atelier_version}
                            </code>
                          </div>
                          {a.ip_at_accept ? (
                            <div className="text-[var(--fg-muted)]">
                              IP:{" "}
                              <code className="rounded bg-[var(--bg-muted)] px-1 text-[11px]">
                                {a.ip_at_accept}
                              </code>
                            </div>
                          ) : null}
                        </div>
                        {a.user_agent_at_accept ? (
                          <div className="mt-2 text-[var(--fg-subtle)]">
                            UA:{" "}
                            <span className="break-all font-mono text-[11px]">
                              {a.user_agent_at_accept}
                            </span>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setEulaTarget(null);
                setEulaHistory({ kind: "loading" });
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
