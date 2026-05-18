/**
 * Atelier launch-notification interest form. Atelier is in active
 * development; this form is NOT a checkout. It collects first name,
 * last name, email, optional business name, optional notes and POSTs
 * to /api/atelier-buy-request which persists a Redis row and fires
 * two transactional emails (admin notification + visitor
 * confirmation).
 *
 * Distinct from atelier-checkout-button.tsx, which initiates the
 * actual Stripe checkout for a signed-in customer. That button is
 * gated by atelier-purchase-gate.tsx; this form has no gate.
 */
"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LeadNameFields,
  RequiredMark,
} from "@/components/marketing/lead-form-fields";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

interface AtelierBuyFormProps {
  className?: string;
}

/**
 * Notify-on-launch / interest-capture form for the Atelier marketing
 * page's #buy-atelier section. Atelier is in active development; this
 * form does NOT take payment. Submitters receive a confirmation now
 * and a single launch notification when the installer ships.
 *
 * POSTs to /api/atelier-buy-request with name + email + optional
 * business name + optional notes. Atelier is a Software Projects
 * prebuilt product, not a HubSpot per-portal entitlement — the route
 * intentionally avoids the HubSpot Forms mirror and the per-portal
 * entitlement machinery.
 *
 * Atelier is a single-tier $149 product (at launch). There is no
 * tier selection here; customization is a post-purchase service
 * engagement, not a pre-pay tier.
 */

export function AtelierBuyForm({ className }: AtelierBuyFormProps) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [businessName, setBusinessName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const payload = {
        firstName,
        lastName,
        email,
        businessName: businessName.trim().length > 0 ? businessName : undefined,
        notes: notes.trim().length > 0 ? notes : undefined,
      };
      const res = await fetch("/api/atelier-buy-request", {
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
          /* fall through to default message */
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
            Got it. We&apos;ll let you know when Atelier ships.
          </div>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Check your inbox — a confirmation is on its way. One email at
            launch, no newsletter, no follow-ups.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-5", className)}>
      <LeadNameFields
        idPrefix="atelier-buy"
        firstName={firstName}
        lastName={lastName}
        setFirstName={setFirstName}
        setLastName={setLastName}
        disabled={status === "submitting"}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="atelier-buy-email">
            Email
            <RequiredMark />
          </Label>
          <Input
            id="atelier-buy-email"
            type="email"
            required
            aria-required="true"
            autoComplete="email"
            inputMode="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "submitting"}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="atelier-buy-business">
            Business name{" "}
            <span className="font-normal text-[var(--fg-subtle)]">
              (optional)
            </span>
          </Label>
          <Input
            id="atelier-buy-business"
            type="text"
            autoComplete="organization"
            placeholder="Northstar Weddings & Co."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={status === "submitting"}
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="atelier-buy-notes">
          Anything we should know?{" "}
          <span className="font-normal text-[var(--fg-subtle)]">
            (optional)
          </span>
        </Label>
        <textarea
          id="atelier-buy-notes"
          rows={4}
          maxLength={2000}
          placeholder="Questions, context, or anything else you'd like us to know before we follow up. Otherwise leave blank."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={status === "submitting"}
          className={cn(
            "mt-1.5 w-full rounded-md border bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] transition-colors outline-none",
            "border-[var(--border)] hover:border-[var(--border-strong)]",
            "focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/20",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        />
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--fg-subtle)]">
          No payment today. One email when Atelier ships.
        </p>
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
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
