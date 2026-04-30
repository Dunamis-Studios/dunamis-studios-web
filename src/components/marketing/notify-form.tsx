"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductCatalogSlug } from "@/lib/types";

type Status = "idle" | "submitting" | "success" | "error";

interface NotifyFormProps {
  product: ProductCatalogSlug;
  productName: string;
  className?: string;
}

/**
 * Email capture form rendered at the bottom of unshipped product pages.
 * POSTs to /api/notify with { email, product }. Shows an inline success
 * state on 200 and an inline error message otherwise. The visitor's
 * email is persisted to Redis even if the confirmation email fails on
 * the server side.
 */
export function NotifyForm({
  product,
  productName,
  className,
}: NotifyFormProps) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product }),
      });
      if (!res.ok) {
        let message = "Something went wrong. Please try again.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // fall through to default message
        }
        setStatus("error");
        setErrorMessage(message);
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 text-left",
          className,
        )}
      >
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]"
          aria-hidden
        />
        <div>
          <div className="text-sm font-medium text-[var(--fg)]">
            Got it. We&apos;ll let you know.
          </div>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            One email when {productName} ships. No newsletter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`notify-${product}`} className="sr-only">
          Email address
        </label>
        <input
          id={`notify-${product}`}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] disabled:opacity-60"
        />
        <Button
          type="submit"
          size="lg"
          disabled={status === "submitting"}
          aria-disabled={status === "submitting"}
        >
          {status === "submitting" ? "Sending..." : "Notify me"}
          {status === "submitting" ? null : (
            <ArrowRight className="ml-0.5 h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>
      {status === "error" && errorMessage ? (
        <p
          role="alert"
          className="text-sm text-[var(--color-danger)]"
        >
          {errorMessage}
        </p>
      ) : (
        <p className="text-xs text-[var(--fg-subtle)]">
          One email when it ships. No newsletter, no sharing.
        </p>
      )}
    </form>
  );
}
