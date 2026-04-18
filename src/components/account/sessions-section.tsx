"use client";

import * as React from "react";
import { SectionCard } from "./section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import type { Session } from "@/lib/types";

interface Props {
  currentSessionId: string;
  initialSessions: Session[];
}

export function SessionsSection({ currentSessionId, initialSessions }: Props) {
  const { push } = useToast();
  const [sessions, setSessions] = React.useState(initialSessions);
  const [working, setWorking] = React.useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = React.useState(false);

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
