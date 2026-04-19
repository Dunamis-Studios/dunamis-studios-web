import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "./signup-form";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create your Dunamis Studios account.",
  robots: { index: false, follow: true },
};

type SignupSearchParams = {
  claim?: string;
  email?: string;
  state?: string;
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<SignupSearchParams>;
}) {
  let session: Awaited<ReturnType<typeof getCurrentSession>> = null;
  try {
    session = await getCurrentSession();
  } catch {
    /* redis not configured locally; continue */
  }
  if (session) redirect("/account");

  const sp = (await searchParams) ?? {};
  const claim = typeof sp.claim === "string" ? sp.claim : undefined;
  const state = typeof sp.state === "string" ? sp.state : undefined;
  const initialEmail =
    typeof sp.email === "string" ? sp.email.trim() : undefined;

  // Only surface the "install handoff" hint when we actually have
  // both sides of the claim context. A bare ?claim= without state
  // can't be completed, so we ignore it and render the plain signup.
  const hasClaim = !!(claim && state);

  return (
    <AuthCard
      title={
        hasClaim ? "Create your Dunamis account" : "Create your account"
      }
      description={
        hasClaim
          ? "One account links all your Dunamis Studios installs. Sign up to finish connecting Debrief."
          : "One account for every Dunamis Studios app."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={
              hasClaim
                ? `/login?redirect=${encodeURIComponent(`/api/entitlements/claim?portalId=${claim!.replace(/^debrief:/, "")}&email=${encodeURIComponent(initialEmail ?? "")}&state=${encodeURIComponent(state!)}`)}`
                : "/login"
            }
            className="text-[var(--accent)] hover:underline"
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
      />
    </AuthCard>
  );
}
