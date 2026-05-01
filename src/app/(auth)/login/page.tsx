import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "./login-form";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Dunamis Studios account.",
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectTo } = await searchParams;
  let session: Awaited<ReturnType<typeof getCurrentSession>> = null;
  try {
    session = await getCurrentSession();
  } catch {
    /* redis not configured locally; continue */
  }
  if (session) redirect(sanitizeRedirect(redirectTo) ?? "/account");
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to manage your Dunamis Studios entitlements."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-[var(--accent)] underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={sanitizeRedirect(redirectTo) ?? "/account"} />
    </AuthCard>
  );
}

function sanitizeRedirect(input: string | undefined): string | null {
  if (!input) return null;
  // Only allow same-origin internal paths
  if (!input.startsWith("/") || input.startsWith("//")) return null;
  return input;
}
