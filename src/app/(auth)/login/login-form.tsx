"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";

/**
 * Restrict redirect targets to same-origin internal paths so a crafted
 * `?redirect=//evil.com` cannot bounce a user off the site after a
 * successful sign-in. This used to live in the server page; mirrored
 * here verbatim because the client now reads searchParams directly.
 */
function sanitizeRedirect(input: string | null): string | null {
  if (!input) return null;
  if (!input.startsWith("/") || input.startsWith("//")) return null;
  return input;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get("redirect")) ?? "/account";

  const [loading, setLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});

  /**
   * If the visitor is already signed in, bounce them to the redirect
   * target (or /account) without rendering the form. Replaces the
   * server-side getCurrentSession + redirect that previously forced
   * this page to render dynamically.
   */
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { account: null }))
      .then((data: { account: unknown }) => {
        if (cancelled) return;
        if (data.account) router.replace(redirectTo);
      })
      .catch(() => {
        /* not signed in or redis down: render the form */
      });
    return () => {
      cancelled = true;
    };
  }, [redirectTo, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    };
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error?.fields) setFieldErrors(data.error.fields);
        setFormError(data?.error?.message ?? "Sign-in failed.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setFormError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
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

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5"
          error={fieldErrors.password}
        />
        <FieldError>{fieldErrors.password}</FieldError>
      </div>

      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {formError}
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
