"use client";

import * as React from "react";
import { Turnstile } from "@marsidev/react-turnstile";

/**
 * Cloudflare Turnstile widget wrapper. Reusable across every public
 * site form (support, contact, notify, courses, the 9 tool forms).
 *
 * The parent form owns the token in its own state. On success we hand
 * the token back; on error / expire we hand back the empty string so
 * the parent can re-disable its submit button until the next solve.
 *
 * Why no internal token state: forms validate the entire payload at
 * submit time via Zod. Keeping the token in the parent's form state
 * means the existing validation pipeline can fail the submit cleanly
 * if the token is missing, without the widget knowing anything about
 * Zod.
 *
 * Site key handling: if NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset at
 * render time, we render a small "Security check unavailable"
 * placeholder rather than crashing. Production must have the env
 * var; dev / preview without it stays usable for layout work.
 */

export interface TurnstileWidgetProps {
  /** Called with the freshly-solved token. */
  onSuccess: (token: string) => void;
  /** Called when Cloudflare rejects the challenge. Token is cleared. */
  onError?: (error: string) => void;
  /** Called when the token expires. Token is cleared. */
  onExpire?: () => void;
  /**
   * Optional action name forwarded to Cloudflare for per-form
   * analytics. Use the form's short slug ("support", "contact",
   * "notify", "courses", or the tool slug).
   */
  action?: string;
  /** Visual: forces light / dark / system theme. Defaults to auto. */
  theme?: "light" | "dark" | "auto";
  className?: string;
}

export function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
  action,
  theme = "auto",
  className,
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    if (typeof window !== "undefined") {
      // Warn loudly in the browser console so a preview deploy
      // missing the key is obvious; do not crash the form.
      console.error(
        "[turnstile-widget] NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset. " +
          "Form submissions will be blocked server-side. Set the env " +
          "var in Vercel for this environment.",
      );
    }
    return (
      <p
        role="status"
        className={className ?? "text-xs text-[var(--fg-subtle)]"}
      >
        Security check unavailable. Please refresh, or email
        support@dunamisstudios.net if the issue persists.
      </p>
    );
  }

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onSuccess}
      onError={(err) => {
        onSuccess("");
        onError?.(err);
      }}
      onExpire={() => {
        onSuccess("");
        onExpire?.();
      }}
      options={{
        theme,
        appearance: "interaction-only",
        ...(action ? { action } : {}),
      }}
      className={className}
    />
  );
}
