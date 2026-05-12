"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";

/**
 * Inline "copy account id to clipboard" affordance under the customer
 * detail header. Keeps the id visible (admins routinely need it for
 * cross-system reference) without making the header heavy.
 *
 * Falls back to a no-op if the Clipboard API is unavailable. The "did
 * copy" flash lasts 1500ms; navigator.clipboard rejections (Firefox
 * restrictive permissions, http origin) surface a brief "copy failed"
 * state instead.
 */
export function AccountIdCopyButton({ accountId }: { accountId: string }) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">(
    "idle",
  );

  React.useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 1500);
    return () => clearTimeout(t);
  }, [state]);

  async function handleCopy() {
    if (!navigator.clipboard) {
      setState("failed");
      return;
    }
    try {
      await navigator.clipboard.writeText(accountId);
      setState("copied");
    } catch (err) {
      console.error("[account-id-copy] writeText failed", err);
      setState("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 font-mono text-xs text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--fg)]"
      title="Copy account ID"
    >
      <span className="select-all">{accountId}</span>
      {state === "copied" ? (
        <Check className="h-3 w-3 text-[var(--color-success-700,#047857)] dark:text-[#6ee7b7]" aria-hidden />
      ) : state === "failed" ? (
        <span className="text-[var(--color-danger-fg,#991b1b)] dark:text-[#fca5a5]">
          copy failed
        </span>
      ) : (
        <Copy className="h-3 w-3" aria-hidden />
      )}
    </button>
  );
}
