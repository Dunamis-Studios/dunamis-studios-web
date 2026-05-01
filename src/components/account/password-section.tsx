"use client";

import * as React from "react";
import { SectionCard } from "./section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function PasswordSection() {
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      currentPassword: String(fd.get("currentPassword") ?? ""),
      newPassword: String(fd.get("newPassword") ?? ""),
      confirmPassword: String(fd.get("confirmPassword") ?? ""),
    };
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error?.fields) setErrors(data.error.fields);
        setError(data?.error?.message ?? "Couldn't update password.");
        return;
      }
      push({
        kind: "success",
        title: "Password updated",
        description: "Other sessions were signed out.",
      });
      formRef.current?.reset();
    } catch {
      setError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="Password"
      description="Updating your password signs out every other active session."
    >
      <form ref={formRef} onSubmit={onSubmit} className="space-y-5" noValidate>
        <div>
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1.5"
            error={errors.currentPassword}
          />
          <FieldError>{errors.currentPassword}</FieldError>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1.5"
              error={errors.newPassword}
            />
            {errors.newPassword ? (
              <FieldError>{errors.newPassword}</FieldError>
            ) : (
              <FieldHint>8+ chars, with a number or symbol.</FieldHint>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1.5"
              error={errors.confirmPassword}
            />
            <FieldError>{errors.confirmPassword}</FieldError>
          </div>
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
          <Button type="submit" loading={loading}>
            Update password
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
