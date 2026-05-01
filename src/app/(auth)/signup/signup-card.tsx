"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "./signup-form";
import { parseClaimToken } from "@/lib/validation";
import { PRODUCT_META } from "@/lib/types";

/**
 * Client wrapper that holds the claim-aware UX. Used to live in
 * signup/page.tsx as a server component; moved here so the page itself
 * can render statically. The page reads no cookies and no searchParams,
 * which lets it pass bf-cache and skip force-dynamic.
 *
 * On hydration this component:
 *   - reads `?claim=`, `?state=`, `?email=` from the URL,
 *   - parses the claim token to derive product copy,
 *   - swaps the AuthCard title / description / footer to the install-
 *     handoff variant when both halves of the claim are present,
 *   - bounces already-signed-in visitors to /account.
 */
export function SignupCard() {
  const router = useRouter();
  const sp = useSearchParams();

  const claim = sp.get("claim") ?? undefined;
  const state = sp.get("state") ?? undefined;
  const initialEmail = sp.get("email") ?? undefined;

  const parsedClaim = claim ? parseClaimToken(claim) : null;
  const hasClaim = !!(parsedClaim && state);
  const productName: string | null = parsedClaim
    ? PRODUCT_META[parsedClaim.product].name
    : null;

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { account: null }))
      .then((data: { account: unknown }) => {
        if (cancelled) return;
        if (data.account) router.replace("/account");
      })
      .catch(() => {
        /* not signed in or redis down: render the form */
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AuthCard
      title={hasClaim ? "Create your Dunamis account" : "Create your account"}
      description={
        hasClaim
          ? `One account links all your Dunamis Studios installs. Sign up to finish connecting ${productName}.`
          : "One account for every Dunamis Studios app."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={
              hasClaim
                ? `/login?redirect=${encodeURIComponent(`/api/entitlements/claim?app=${parsedClaim!.product}&portalId=${parsedClaim!.portalId}&email=${encodeURIComponent(initialEmail ?? "")}&state=${encodeURIComponent(state!)}`)}`
                : "/login"
            }
            className="text-[var(--accent)] underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm
        initialEmail={initialEmail}
        claim={hasClaim ? claim : undefined}
        state={hasClaim ? state : undefined}
        productName={productName ?? undefined}
      />
    </AuthCard>
  );
}
