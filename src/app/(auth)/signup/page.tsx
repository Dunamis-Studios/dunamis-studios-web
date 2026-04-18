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

export default async function SignupPage() {
  let session: Awaited<ReturnType<typeof getCurrentSession>> = null;
  try {
    session = await getCurrentSession();
  } catch {
    /* redis not configured locally; continue */
  }
  if (session) redirect("/account");
  return (
    <AuthCard
      title="Create your account"
      description="One account for every Dunamis Studios app."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
