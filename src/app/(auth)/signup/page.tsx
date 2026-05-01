import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupCard } from "./signup-card";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create your Dunamis Studios account.",
  robots: { index: false, follow: true },
};

/**
 * Static shell. SignupCard is the client island that handles claim
 * parsing, copy variants, and the redirect-if-signed-in check.
 * Suspense is required around any client component that calls
 * useSearchParams() under static rendering, otherwise Next.js bails
 * the route out to dynamic.
 */
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupCard />
    </Suspense>
  );
}
