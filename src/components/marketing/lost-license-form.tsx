"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredMark } from "@/components/marketing/lead-form-fields";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Lost-license self-service form.
 *
 * POSTs to /api/atelier/lookup-license. The endpoint always returns
 * 200 regardless of whether the email matched a license (anti-
 * enumeration), so the success state always says "if we found a
 * license, we sent it" — never confirming or denying that a
 * particular email is in the customer database.
 *
 * The honeypot field `website` is rendered with display:none. Real
 * users never fill it; bots that auto-fill every visible-or-not
 * input land their value here and the server treats that submission
 * as a no-op match.
 */

export function LostLicenseForm({ className }: { className?: string }) {
  const [email, setEmail] = React.useState("");
  const [website, setWebsite] = React.useState(""); // honeypot
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/atelier/lookup-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      // The endpoint always returns 200 with the same body shape, so
      // any 2xx is a successful submission. Network errors fall
      // through to the catch.
      if (!res.ok) {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
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
            If we found a license, we sent it.
          </div>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Check your inbox in the next few minutes. If nothing arrives,
            also check the spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-4", className)}>
      <div>
        <Label htmlFor="lost-license-email">
          Email
          <RequiredMark />
        </Label>
        <Input
          id="lost-license-email"
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

      {/* Honeypot. Real users never see this field. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="lost-license-website">
          Website (leave empty)
        </label>
        <input
          id="lost-license-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={status === "submitting"}
        aria-disabled={status === "submitting"}
        className="self-stretch"
      >
        {status === "submitting" ? "Looking up…" : "Send my license"}
        {status === "submitting" ? null : (
          <ArrowRight className="ml-0.5 h-4 w-4" aria-hidden />
        )}
      </Button>

      {status === "error" && errorMessage ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
