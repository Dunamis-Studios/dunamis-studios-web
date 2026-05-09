"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  accountId: string;
  companyName: string | null;
};

// sessionStorage (not localStorage) — dismissals last for the
// current browser session only, so the banner reappears on next
// login until the customer fills the field. Per spec.
const KEY_PREFIX = "dunamis-company-prompt-dismissed:";

/**
 * Backfill banner for accounts created before companyName was a
 * required signup field. Surfaces on /account and /account/settings;
 * dismissable per-session, reappears next login until the field is
 * filled.
 *
 * Renders nothing when companyName has a value, or when the customer
 * has dismissed it in the current session. Defaults to "not
 * dismissed" so the SSR HTML carries the banner — the dismissed-
 * state read happens after hydration via useEffect, which means a
 * dismissed-but-reloaded page may flash the banner for a frame
 * before hiding it. Acceptable tradeoff: customers who never
 * dismissed see the banner immediately on first paint, which
 * matters more than the post-dismiss flash.
 */
export function CompanyNamePrompt({ accountId, companyName }: Props) {
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY_PREFIX + accountId) === "1") {
        setDismissed(true);
      }
    } catch {
      // sessionStorage can throw in restricted iframes / privacy
      // modes — treat as "not dismissed" and let the customer see
      // the banner. The CTA still works without storage.
    }
  }, [accountId]);

  if (companyName && companyName.trim().length > 0) return null;
  if (dismissed) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4"
    >
      <p className="text-sm text-[var(--fg)]">
        Add your company name to your profile so future Dunamis products know
        who you are. Takes 5 seconds.
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button asChild size="sm">
          <Link href="/account/settings">Add it</Link>
        </Button>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(KEY_PREFIX + accountId, "1");
            } catch {
              // Even if storage fails, hide for the rest of this
              // page view via component state.
            }
            setDismissed(true);
          }}
          aria-label="Dismiss"
          className="rounded-md p-1.5 text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
