"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Fields {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  confirmPassword?: string;
}

export interface SignupFormProps {
  /**
   * Pre-fill the email field — used by the HubSpot install handoff
   * so the installer doesn't have to retype their address.
   */
  initialEmail?: string;
  /**
   * Install-handoff claim in "{product}:{portalId}" format (e.g.
   * "debrief:12345" or "property-pulse:12345"). Forwarded untouched
   * to /api/auth/signup which validates the format and links the
   * stub entitlement after account creation.
   */
  claim?: string;
  /**
   * HMAC-signed state token from the installing app. Paired with
   * `claim`.
   */
  state?: string;
  /**
   * Human-readable product name for the install-handoff copy (e.g.
   * "Debrief" or "Property Pulse"). Derived from `claim` by the
   * server component; the form itself doesn't re-parse.
   */
  productName?: string;
}

type ClaimResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export function SignupForm({
  initialEmail,
  claim,
  state,
  productName,
}: SignupFormProps = {}) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Fields>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const hasClaim = !!(claim && state);
  // Fallback to "your install" so an unexpected missing productName
  // doesn't leak "undefined" into toasts.
  const productLabel = productName ?? "your install";
  // Addendum anchor on the stacked /terms page. Defaults to the
  // Debrief anchor when claim is present but product can't be parsed;
  // harmless because hasClaim also gates whether this link renders.
  const addendumAnchor =
    claim?.startsWith("property-pulse:")
      ? "/terms#addendum-property-pulse"
      : "/terms#addendum-debrief";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      firstName: String(fd.get("firstName") ?? ""),
      lastName: String(fd.get("lastName") ?? ""),
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      confirmPassword: String(fd.get("confirmPassword") ?? ""),
    };
    if (hasClaim) {
      body.claim = claim!;
      body.state = state!;
    }
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: {
          code?: string;
          message?: string;
          fields?: Fields;
        };
        claim?: ClaimResult;
      };
      if (!res.ok) {
        if (data?.error?.fields) setErrors(data.error.fields);
        setFormError(data?.error?.message ?? "Something went wrong.");
        return;
      }

      // Account creation succeeded.
      if (hasClaim) {
        if (data.claim && data.claim.ok) {
          push({
            kind: "success",
            title: "Welcome to Dunamis Studios",
            description: `Your ${productLabel} install is linked. Check your email to verify your address.`,
          });
          router.push(data.claim.redirectTo);
          router.refresh();
          return;
        }
        // Claim failed but account still created — route to /account
        // and surface the claim error as a non-fatal toast.
        const claimError =
          data.claim && !data.claim.ok
            ? data.claim.error
            : "Linking failed unexpectedly.";
        push({
          kind: "error",
          title: `Account created — ${productLabel} link failed`,
          description: `${claimError} You can retry from the ${productLabel} app.`,
        });
        router.push("/account");
        router.refresh();
        return;
      }

      // No claim context — normal signup.
      push({
        kind: "success",
        title: "Welcome to Dunamis Studios",
        description: "Check your email to verify your address.",
      });
      router.push("/account");
      router.refresh();
    } catch {
      setFormError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            required
            className="mt-1.5"
            error={errors.firstName}
          />
          <FieldError>{errors.firstName}</FieldError>
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
            className="mt-1.5"
            error={errors.lastName}
          />
          <FieldError>{errors.lastName}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={initialEmail ?? ""}
          className="mt-1.5"
          error={errors.email}
        />
        {errors.email ? (
          <FieldError>{errors.email}</FieldError>
        ) : hasClaim ? (
          <FieldHint>
            HubSpot installer email — we&apos;ll link your {productLabel}{" "}
            install to this Dunamis account.
          </FieldHint>
        ) : null}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1.5"
          error={errors.password}
        />
        {errors.password ? (
          <FieldError>{errors.password}</FieldError>
        ) : (
          <FieldHint>At least 8 characters, and a number or symbol.</FieldHint>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
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

      {formError ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {formError}
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Create account
      </Button>

      <p className="text-center text-xs text-[var(--fg-subtle)]">
        {hasClaim ? (
          <>
            By creating an account and linking this portal, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[var(--fg)]">
              Terms of Service
            </Link>
            ,{" "}
            <Link href="/privacy" className="underline hover:text-[var(--fg)]">
              Privacy Policy
            </Link>
            ,{" "}
            <Link
              href="/legal/dpa"
              className="underline hover:text-[var(--fg)]"
            >
              Data Processing Addendum
            </Link>
            , and the{" "}
            <Link
              href={addendumAnchor}
              className="underline hover:text-[var(--fg)]"
            >
              {productLabel} Service Addendum
            </Link>
            .
          </>
        ) : (
          <>
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-[var(--fg)]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-[var(--fg)]">
              Privacy Policy
            </Link>
            .
          </>
        )}
      </p>
    </form>
  );
}
