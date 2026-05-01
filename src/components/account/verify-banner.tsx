"use client";

import { MailCheck } from "lucide-react";
import * as React from "react";

export function VerifyBanner({ email }: { email: string }) {
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function resend() {
    setSending(true);
    try {
      // Trigger a verification re-send by touching the profile endpoint with
      // the current email — the endpoint re-issues a token on email change,
      // so we hit the dedicated re-send API instead.
      await fetch("/api/account/resend-verification", { method: "POST" });
      setSent(true);
    } catch {
      /* fail quietly — the user can always refresh and try again */
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-warning)]/40 bg-[color-mix(in_oklch,var(--color-warning)_8%,transparent)] px-4 py-3 text-sm"
    >
      <div className="flex items-center gap-3 min-w-0">
        <MailCheck
          className="h-5 w-5 shrink-0 text-[var(--color-warning)]"
          aria-hidden
        />
        <div className="min-w-0">
          <strong className="font-medium text-[var(--fg)]">
            Verify your email
          </strong>
          <span className="text-[var(--fg-muted)]">
            {": "}we sent a link to <span className="font-mono text-[var(--fg)]">{email}</span>.
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={resend}
        disabled={sending || sent}
        className="text-sm font-medium text-[var(--color-warning)] hover:underline disabled:opacity-60"
      >
        {sent ? "Sent" : sending ? "Sending…" : "Resend"}
      </button>
    </div>
  );
}
