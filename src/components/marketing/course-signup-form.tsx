"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Email-course signup form. First name, last name, and email all
 * required. POSTs to /api/courses/signup with the course slug. The
 * site does not send drip emails itself; the HubSpot workflow
 * attached to the courses form is the sender.
 *
 * The Course Name hidden field is not rendered in the form markup;
 * the API route hardcodes it server-side from the COURSES allow-list
 * keyed by courseSlug, so the field cannot be tampered with by the
 * client. See src/lib/hubspot-courses-form.ts for the field name
 * (course_name) that lands in the HubSpot form submission.
 */

function readHubspotUtk(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function RequiredMark() {
  return (
    <span
      aria-hidden
      className="ml-0.5 text-[var(--color-danger)]"
      title="Required"
    >
      *
    </span>
  );
}

type Status = "idle" | "submitting" | "success" | "error";

export interface CourseSignupFormProps {
  courseSlug: string;
  /** Display name of the course. Hidden field on submit. */
  courseName: string;
  /**
   * Success copy. Defaults to a short check-your-inbox line; pass a
   * custom string when a course wants different post-submit messaging.
   */
  successMessage?: string;
}

export function CourseSignupForm({
  courseSlug,
  courseName,
  successMessage = "Check your inbox. Day 1 is on its way.",
}: CourseSignupFormProps) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const hubspotutk = readHubspotUtk();
      const payload: Record<string, string> = {
        firstName,
        lastName,
        email,
        courseSlug,
      };
      if (hubspotutk) payload.hubspotutk = hubspotutk;
      const res = await fetch("/api/courses/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let message = "Could not sign you up. Please try again.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // fall through
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
      <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]"
          aria-hidden
        />
        <div>
          <div className="text-sm font-medium text-[var(--fg)]">
            You&apos;re in.
          </div>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            {successMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-7"
      aria-label={`${courseName} signup`}
    >
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Sign up
      </div>
      <h3 className="mt-2 font-[var(--font-display)] text-xl font-medium leading-snug tracking-tight text-[var(--fg)] sm:text-2xl">
        Start the course
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
        Day 1 sends within a few minutes. One email per day for five days.
        No newsletter, no sharing.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="course-first-name">
            First name
            <RequiredMark />
          </Label>
          <Input
            id="course-first-name"
            type="text"
            autoComplete="given-name"
            required
            aria-required="true"
            placeholder="Pat"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={status === "submitting"}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="course-last-name">
            Last name
            <RequiredMark />
          </Label>
          <Input
            id="course-last-name"
            type="text"
            autoComplete="family-name"
            required
            aria-required="true"
            placeholder="Lee"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={status === "submitting"}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="course-email">
          Email
          <RequiredMark />
        </Label>
        <Input
          id="course-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-required="true"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          className="mt-1.5"
        />
      </div>

      <div className="mt-5">
        <Button
          type="submit"
          disabled={status === "submitting"}
          aria-disabled={status === "submitting"}
        >
          {status === "submitting" ? "Sending..." : "Send me Day 1"}
          {status === "submitting" ? null : (
            <ArrowRight className="ml-0.5 h-4 w-4" aria-hidden />
          )}
        </Button>
      </div>

      {status === "error" && errorMessage ? (
        <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
