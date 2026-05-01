"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";

export function ForgotForm() {
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string }>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: String(fd.get("email") ?? "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error?.fields) setFieldErrors(data.error.fields);
        setError(data?.error?.message ?? "Something went wrong.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-5 text-center text-sm text-[var(--fg)]"
      >
        If an account exists for that email, a reset link has been sent.
        Check your inbox (and spam folder, just in case).
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className="mt-1.5"
          error={fieldErrors.email}
        />
        <FieldError>{fieldErrors.email}</FieldError>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {error}
        </div>
      ) : null}
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Send reset link
      </Button>
    </form>
  );
}
