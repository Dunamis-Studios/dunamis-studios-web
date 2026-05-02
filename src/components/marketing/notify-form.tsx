"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadNameFields, RequiredMark } from "@/components/marketing/lead-form-fields";
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
 * POSTs to /api/notify with { email, product, hubspotutk? }. The
 * hubspotutk value is the HubSpot tracking cookie; including it in the
 * payload lets HubSpot link the form submission back to the visitor's
 * existing tracking session for source attribution and page journey
 * data. The cookie is missing for visitors with tracking blocked, in
 * which case the field is omitted and HubSpot still creates the
 * contact, just without session linkage. Shows an inline success state
 * on 200 and an inline error message otherwise. The visitor's email is
 * persisted to Redis even if the HubSpot mirror or the confirmation
 * email fails server side.
 */

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(
    /(?:^|;\s*)hubspotutk=([^;]+)/,
  );
  return match ? decodeURIComponent(match[1]) : "";
}
export function NotifyForm({
  product,
  productName,
  className,
}: NotifyFormProps) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const hubspotutk = readHubspotUtk();
      const payload: Record<string, string> = {
        firstName,
        lastName,
        email,
        product,
      };
      if (hubspotutk) payload.hubspotutk = hubspotutk;
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-4", className)}>
      <LeadNameFields
        idPrefix={`notify-${product}`}
        firstName={firstName}
        lastName={lastName}
        setFirstName={setFirstName}
        setLastName={setLastName}
        disabled={status === "submitting"}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor={`notify-${product}-email`}>
            Email
            <RequiredMark />
          </Label>
          <Input
            id={`notify-${product}-email`}
            type="email"
            required
            aria-required="true"
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "submitting"}
            className="mt-1.5"
          />
        </div>
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
