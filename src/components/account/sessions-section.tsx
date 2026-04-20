"use client";

import * as React from "react";
import { SectionCard } from "./section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn, formatDateTime } from "@/lib/utils";
import type { Session } from "@/lib/types";
import type { SessionLifetimeDays } from "@/lib/session";

interface Props {
  currentSessionId: string;
  initialSessions: Session[];
  initialSessionLifetimeDays: SessionLifetimeDays;
}

const SESSION_LIFETIME_OPTIONS: ReadonlyArray<{
  value: SessionLifetimeDays;
  label: string;
}> = [
  { value: 1, label: "1 day" },
  { value: 3, label: "3 days" },
  { value: 7, label: "1 week" },
];

export function SessionsSection({
  currentSessionId,
  initialSessions,
  initialSessionLifetimeDays,
}: Props) {
  const { push } = useToast();
  const [sessions, setSessions] = React.useState(initialSessions);
  const [working, setWorking] = React.useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = React.useState(false);

  const [lifetime, setLifetime] = React.useState<SessionLifetimeDays>(
    initialSessionLifetimeDays,
  );
  const [savingLifetime, setSavingLifetime] = React.useState(false);

  async function changeLifetime(next: SessionLifetimeDays) {
    if (next === lifetime || savingLifetime) return;
    const prev = lifetime;
    setLifetime(next); // optimistic
    setSavingLifetime(true);
    try {
      const res = await fetch("/api/account/session-lifetime", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ days: next }),
      });
      if (!res.ok) {
        setLifetime(prev);
        let msg = "Couldn't update session length. Try again.";
        try {
          const body = (await res.json()) as {
            error?: { message?: string };
          };
          if (body?.error?.message) msg = body.error.message;
        } catch {
          // Non-JSON error body; keep the generic message.
        }
        push({
          kind: "error",
          title: "Session length not updated",
          description: msg,
        });
        return;
      }
      push({ kind: "success", title: "Session length updated" });
    } catch {
      setLifetime(prev);
      push({
        kind: "error",
        title: "Session length not updated",
        description: "Network error. Try again.",
      });
    } finally {
      setSavingLifetime(false);
    }
  }

  async function revoke(sessionId: string) {
    setWorking(sessionId);
    try {
      const res = await fetch(
        `/api/account/sessions/${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setSessions((ss) => ss.filter((s) => s.sessionId !== sessionId));
        push({ kind: "success", title: "Session revoked" });
        if (sessionId === currentSessionId) {
          window.location.href = "/login";
        }
      } else {
        push({ kind: "error", title: "Couldn't revoke session" });
      }
    } finally {
      setWorking(null);
    }
  }

  async function signOutAllOthers() {
    setSigningOutAll(true);
    try {
      const res = await fetch("/api/account/sessions", { method: "DELETE" });
      if (res.ok) {
        setSessions((ss) => ss.filter((s) => s.sessionId === currentSessionId));
        push({ kind: "success", title: "Signed out of other sessions" });
      } else {
        push({ kind: "error", title: "Couldn't sign out of other sessions" });
      }
    } finally {
      setSigningOutAll(false);
    }
  }

  return (
    <SectionCard
      title="Active sessions"
      description="Devices currently signed in to your account. Revoke anything you don't recognize."
    >
      {/* Session length row — applies to new sessions on next login. */}
      <div className="mb-6 border-b border-[var(--border)] pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--fg)]">
              Session length
            </p>
            <p className="mt-1 text-xs text-[var(--fg-muted)]">
              Applies to new sessions. Existing sessions keep their current
              expiry.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Session length"
            className="inline-flex shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5"
          >
            {SESSION_LIFETIME_OPTIONS.map((opt) => {
              const active = opt.value === lifetime;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => changeLifetime(opt.value)}
                  disabled={savingLifetime}
                  className={cn(
                    "rounded px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    active
                      ? "bg-[var(--bg-muted)] text-[var(--fg)]"
                      : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
                    "disabled:opacity-60 disabled:pointer-events-none",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          variant="secondary"
          onClick={signOutAllOthers}
          loading={signingOutAll}
          disabled={sessions.length <= 1}
        >
          Sign out of all others
        </Button>
      </div>
      <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
        {sessions.map((s) => {
          const isCurrent = s.sessionId === currentSessionId;
          return (
            <li
              key={s.sessionId}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {parseUserAgent(s.userAgent)}
                  </span>
                  {isCurrent ? <Badge variant="accent">This device</Badge> : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--fg-muted)]">
                  <span className="font-mono">{s.ip}</span>
                  <span>Created {formatDateTime(s.createdAt)}</span>
                  <span>Expires {formatDateTime(s.expiresAt)}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant={isCurrent ? "outline" : "ghost"}
                onClick={() => revoke(s.sessionId)}
                loading={working === s.sessionId}
              >
                {isCurrent ? "Sign out" : "Revoke"}
              </Button>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

function parseUserAgent(ua: string): string {
  if (!ua || ua === "unknown") return "Unknown device";
  // Quick, non-comprehensive humanization — good enough for a settings list.
  const browser = ua.match(/(Firefox|Chrome|Safari|Edg|Opera)\/[\d.]+/)?.[1];
  const os =
    ua.match(/Windows NT [\d.]+/)?.[0] ??
    ua.match(/Mac OS X [\d_.]+/)?.[0] ??
    ua.match(/(Android|iPhone|iPad|Linux)/)?.[0] ??
    "Desktop";
  return `${browser ?? "Browser"} · ${os.replace(/_/g, ".")}`;
}
