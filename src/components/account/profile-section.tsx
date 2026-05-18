/**
 * Profile editing section on the /account page. Renders the first /
 * last name, email, company name, and time zone fields, with inline
 * Zod validation against profileUpdateSchema (src/lib/validation.ts)
 * before posting to /api/account.
 *
 * Email rotation is handled by the same endpoint; the EmailVerified
 * badge auto-clears when the email field is dirty so the user knows
 * a new verification email will be sent on save.
 */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "./section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

interface Props {
  firstName: string;
  lastName: string;
  companyName: string | null;
  timeZone: string | null;
  email: string;
  emailVerified: boolean;
  /** IANA time zones available on the host. Server-rendered from
   *  Intl.supportedValuesOf so the client doesn't ship a vendored
   *  list. Sorted ascending. */
  timeZoneOptions: string[];
}

export function ProfileSection({
  firstName: initialFirst,
  lastName: initialLast,
  companyName: initialCompany,
  timeZone: initialTimeZone,
  email: initialEmail,
  emailVerified,
  timeZoneOptions,
}: Props) {
  const router = useRouter();
  const { push } = useToast();
  const [firstName, setFirstName] = React.useState(initialFirst);
  const [lastName, setLastName] = React.useState(initialLast);
  const [companyName, setCompanyName] = React.useState(initialCompany ?? "");
  const [timeZone, setTimeZone] = React.useState(initialTimeZone ?? "");
  const [email, setEmail] = React.useState(initialEmail);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  // Treat null and "" as the same empty state so the Save button
  // doesn't flicker on accounts that land here without a company
  // name or time zone set yet.
  const initialCompanyTrimmed = (initialCompany ?? "").trim();
  const initialTimeZoneNorm = initialTimeZone ?? "";
  const dirty =
    firstName.trim() !== initialFirst ||
    lastName.trim() !== initialLast ||
    companyName.trim() !== initialCompanyTrimmed ||
    timeZone !== initialTimeZoneNorm ||
    email.trim().toLowerCase() !== initialEmail.toLowerCase();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setError(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          // Server coerces empty / whitespace-only to null; sending
          // the trimmed string here keeps the wire payload clean.
          companyName: companyName.trim(),
          // Empty selection sends null so the customer can clear a
          // mistakenly-set time zone.
          timeZone: timeZone === "" ? null : timeZone,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error?.fields) setErrors(data.error.fields);
        setError(data?.error?.message ?? "Couldn't save profile.");
        return;
      }
      push({
        kind: "success",
        title: "Profile saved",
        description: data.emailChanged
          ? "Check your new email for a verification link."
          : undefined,
      });
      router.refresh();
    } catch {
      setError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="Profile"
      description="Your name and email. Changing your email triggers a re-verification."
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1.5"
              error={errors.firstName}
            />
            <FieldError>{errors.firstName}</FieldError>
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1.5"
              error={errors.lastName}
            />
            <FieldError>{errors.lastName}</FieldError>
          </div>
        </div>
        <div>
          <Label htmlFor="companyName">Company name</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            maxLength={100}
            autoComplete="organization"
            placeholder="Acme Studio"
            className="mt-1.5"
            error={errors.companyName}
          />
          <FieldError>{errors.companyName}</FieldError>
        </div>
        <div>
          <Label htmlFor="timeZone">Time zone</Label>
          <select
            id="timeZone"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40"
          >
            <option value="">Not set</option>
            {timeZoneOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <FieldError>{errors.timeZone}</FieldError>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="email">Email</Label>
            {emailVerified ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="warning">Unverified</Badge>
            )}
          </div>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            error={errors.email}
          />
          <FieldError>{errors.email}</FieldError>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
          >
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" loading={loading} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
