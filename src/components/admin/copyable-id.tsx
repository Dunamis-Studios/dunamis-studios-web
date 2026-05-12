"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";

/**
 * Inline truncated-id with a copy-to-clipboard affordance.
 *
 * Admin tables need to render long opaque IDs (license ids, activation
 * ids, Stripe payment intents) compactly so row layouts stay scannable,
 * while still letting the admin paste the FULL value into Stripe /
 * Vercel / curl. A bare "title" tooltip is not enough: admins routinely
 * need to paste, and selecting truncated text + an ellipsis loses bytes.
 *
 * Renders as: `<truncated>` `<copy-icon-button>` in a single line.
 * Clicking either span or icon copies the full value. A brief check
 * mark replaces the icon for 1.5s on success. Clipboard-API rejections
 * surface as "copy failed" text.
 *
 * Use this for any opaque ID an admin would need to paste elsewhere.
 * Do NOT use it for user-typed labels (device names, company names);
 * those should render in full because they're meaningful as-is.
 */
interface CopyableIdProps {
  /** Full value to copy. */
  value: string;
  /** Optional override for what shows on screen. Defaults to a
   *  prefix slice of `value` plus an ellipsis when value is long. */
  display?: string;
  /** Maximum chars before truncating the auto-generated display.
   *  Ignored if `display` is supplied. Defaults to 11. */
  maxDisplay?: number;
  /** Optional className applied to the outer span. */
  className?: string;
  /** Optional aria-label override. */
  label?: string;
}

function autoTruncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

export function CopyableId({
  value,
  display,
  maxDisplay = 11,
  className,
  label,
}: CopyableIdProps) {
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
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch (err) {
      console.error("[copyable-id] writeText failed", err);
      setState("failed");
    }
  }

  const shown = display ?? autoTruncate(value, maxDisplay);
  const ariaLabel = label ?? `Copy ${value}`;

  return (
    <span
      className={
        "inline-flex items-center gap-1.5 font-mono text-xs text-[var(--fg-muted)] " +
        (className ?? "")
      }
    >
      <span title={value} className="text-[var(--fg)]">
        {shown}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={ariaLabel}
        title={state === "copied" ? "Copied" : `Copy ${value}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
      >
        {state === "copied" ? (
          <Check
            className="h-3 w-3 text-[var(--color-success-700,#047857)] dark:text-[#6ee7b7]"
            aria-hidden
          />
        ) : state === "failed" ? (
          <span className="text-[10px] text-[var(--color-danger-fg,#991b1b)] dark:text-[#fca5a5]">
            !
          </span>
        ) : (
          <Copy className="h-3 w-3" aria-hidden />
        )}
      </button>
    </span>
  );
}
