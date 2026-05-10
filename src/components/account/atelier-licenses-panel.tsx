"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Download,
  Loader2,
  Monitor,
  Pencil,
  PowerOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  PortalEulaAcceptance,
  PortalLicense,
  PortalSlot,
} from "@/app/account/atelier-licenses/page";

/**
 * Customer-portal client panel for Atelier licenses. Renders one
 * card per license with the slot list, slot actions (rename,
 * deactivate), revocation status banner when relevant, and the
 * deactivated-slots history collapsed under a disclosure.
 *
 * Authenticated server fetch happens in the page; this component
 * receives the projected data and handles user interactions via the
 * /api/atelier/{deactivate,rename-device} endpoints with
 * router.refresh() after each mutation to re-pull canonical state.
 */

export interface AtelierLicensesPanelProps {
  licenses: PortalLicense[];
}

export function AtelierLicensesPanel({ licenses }: AtelierLicensesPanelProps) {
  return (
    <div className="space-y-6">
      {licenses.map((license) => (
        <LicenseCard key={license.lid} license={license} />
      ))}
    </div>
  );
}

function LicenseCard({ license }: { license: PortalLicense }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <header className="flex flex-col gap-3 border-b border-[var(--border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-[var(--font-display)] text-lg font-medium tracking-tight">
              Atelier v{license.version_major}.x
            </h2>
            <StatusBadge license={license} />
          </div>
          <p className="mt-1 text-xs text-[var(--fg-subtle)]">
            License id <code className="font-mono">{license.lid}</code> · issued{" "}
            {formatDate(license.issued_at)}
          </p>
        </div>
        <div className="text-sm text-[var(--fg-muted)]">
          <span className="font-medium text-[var(--fg)]">
            {license.slots_used}
          </span>{" "}
          of {license.max_slots} devices
        </div>
      </header>

      {license.status === "revoked" ? (
        <RevocationBanner license={license} />
      ) : null}

      <div className="px-6 py-5">
        {license.active_slots.length === 0 ? (
          <p className="text-sm text-[var(--fg-muted)]">
            No active devices. Activate Atelier on a Windows machine to claim
            a slot — every license starts empty until first activation.
          </p>
        ) : (
          <ul className="space-y-3">
            {license.active_slots.map((slot) => (
              <SlotRow key={slot.activation_id} slot={slot} />
            ))}
          </ul>
        )}
      </div>

      {license.deactivated_slots.length > 0 ? (
        <details className="border-t border-[var(--border)] px-6 py-4 text-sm">
          <summary className="cursor-pointer text-[var(--fg-muted)] hover:text-[var(--fg)]">
            Deactivated devices ({license.deactivated_slots.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {license.deactivated_slots.map((slot) => (
              <li
                key={slot.activation_id}
                className="flex items-center justify-between rounded-md border border-dashed border-[var(--border)] px-3 py-2 text-[var(--fg-muted)]"
              >
                <span className="truncate">{slot.device_label}</span>
                <span className="ml-3 shrink-0 text-xs text-[var(--fg-subtle)]">
                  last seen {formatDate(slot.last_heartbeat_at)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {license.eula_acceptances.length > 0 ? (
        <details className="border-t border-[var(--border)] px-6 py-4 text-sm">
          <summary className="cursor-pointer text-[var(--fg-muted)] hover:text-[var(--fg)]">
            EULA acceptance history ({license.eula_acceptances.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {license.eula_acceptances.map((a) => (
              <EulaAcceptanceRow
                key={`${license.lid}:${a.eula_version}`}
                lid={license.lid}
                acceptance={a}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function EulaAcceptanceRow({
  lid,
  acceptance,
}: {
  lid: string;
  acceptance: PortalEulaAcceptance;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function downloadAccepted() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/atelier/eula-acceptance/${encodeURIComponent(
          lid,
        )}/${encodeURIComponent(acceptance.eula_version)}`,
      );
      const data = await res.json();
      if (!res.ok || !data?.acceptance?.rendered_eula_text) {
        throw new Error(data?.error ?? "download_failed");
      }
      const text = data.acceptance.rendered_eula_text as string;
      // Filename: atelier-eula-accepted-YYYY-MM-DD.md, with the date
      // from accepted_at so a customer with multiple acceptances ends
      // up with distinct filenames.
      const datePart = acceptance.accepted_at.slice(0, 10);
      const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `atelier-eula-accepted-${datePart}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "download_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-[var(--fg-muted)]">
          <span className="text-[var(--fg)]">EULA v{acceptance.eula_version}</span>
          {" · accepted "}
          {formatDate(acceptance.accepted_at)}
          {" · Atelier v"}
          {acceptance.atelier_version}
        </div>
        {acceptance.has_rendered_text ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={downloadAccepted}
            disabled={busy}
            className="shrink-0"
          >
            {busy ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            )}
            Download my accepted EULA
          </Button>
        ) : (
          <span className="text-[11px] text-[var(--fg-subtle)]">
            Verbatim text not stored for this older record
          </span>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-[var(--color-danger)]">
          Couldn&apos;t download — {error}. Try again or email
          legal@dunamisstudios.com.
        </p>
      ) : null}
    </li>
  );
}

function StatusBadge({ license }: { license: PortalLicense }) {
  if (license.status === "active") {
    return <Badge variant="atelier">Active</Badge>;
  }
  if (license.status === "refunded") {
    return <Badge variant="neutral">Refunded</Badge>;
  }
  // revoked
  return <Badge variant="danger">Revoked</Badge>;
}

function RevocationBanner({ license }: { license: PortalLicense }) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--border)] bg-[var(--bg-subtle)] px-6 py-4 text-sm">
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--fg-muted)]"
        aria-hidden
      />
      <div className="text-[var(--fg-muted)]">
        This license has been revoked
        {license.revoked_at ? <> on {formatDate(license.revoked_at)}</> : null}.
        {license.revocation_mode === "grace_14d"
          ? " Atelier is in a 14-day grace window and will lock automatically when the window ends."
          : " Atelier locks immediately on next activation or heartbeat."}{" "}
        If you believe this is in error, email{" "}
        <a
          href="mailto:legal@dunamisstudios.com"
          className="underline underline-offset-2"
        >
          legal@dunamisstudios.com
        </a>
        .
      </div>
    </div>
  );
}

function SlotRow({ slot }: { slot: PortalSlot }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [draftLabel, setDraftLabel] = React.useState(slot.device_label);
  const [busy, setBusy] = React.useState<"rename" | "deactivate" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function commitRename() {
    if (!draftLabel.trim() || draftLabel.trim() === slot.device_label) {
      setEditing(false);
      setDraftLabel(slot.device_label);
      return;
    }
    setBusy("rename");
    setError(null);
    try {
      const res = await fetch("/api/atelier/rename-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activation_id: slot.activation_id,
          device_label: draftLabel.trim(),
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "rename_failed");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "rename_failed");
    } finally {
      setBusy(null);
    }
  }

  async function deactivate() {
    if (
      !confirm(
        `Deactivate "${slot.device_label}"? The slot will free immediately and that device will lock within a day of its next heartbeat.`,
      )
    ) {
      return;
    }
    setBusy("deactivate");
    setError(null);
    try {
      const res = await fetch("/api/atelier/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activation_id: slot.activation_id,
          source: "customer_portal",
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "deactivate_failed");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "deactivate_failed");
      setBusy(null);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <Monitor
        className="h-5 w-5 shrink-0 text-[var(--fg-subtle)]"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === "Escape") {
                  setEditing(false);
                  setDraftLabel(slot.device_label);
                }
              }}
              maxLength={80}
              className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm text-[var(--fg)] outline-none focus:border-[var(--border-strong)]"
              aria-label="Rename device"
            />
            <button
              type="button"
              onClick={commitRename}
              disabled={busy === "rename"}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)]"
              aria-label="Save"
            >
              {busy === "rename" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraftLabel(slot.device_label);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--fg-muted)] hover:text-[var(--fg)]"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[var(--fg)]">
              {slot.device_label}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--fg-subtle)] hover:text-[var(--fg)]"
              aria-label="Rename device"
              title="Rename device"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          v{slot.atelier_version} · activated{" "}
          {formatDate(slot.first_activated_at)} · last seen{" "}
          {formatDate(slot.last_heartbeat_at)}
        </p>
        {error ? (
          <p className="mt-1 text-xs text-[var(--color-danger)]">
            Couldn&apos;t complete — {error}. Try again or email
            legal@dunamisstudios.com.
          </p>
        ) : null}
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={deactivate}
        disabled={busy === "deactivate"}
        className="shrink-0"
      >
        {busy === "deactivate" ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <PowerOff className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        )}
        Deactivate
      </Button>
    </li>
  );
}

function formatDate(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
