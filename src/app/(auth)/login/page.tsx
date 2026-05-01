import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Dunamis Studios account.",
  robots: { index: false, follow: true },
};

/**
 * Static shell. The "redirect to /account if already signed-in" check
 * and the read of `?redirect=` both moved into LoginForm, which fires
 * on hydration. Keeping this page static lets it pass bf-cache and
 * removes the force-dynamic that previously dragged auth pages.
 */
export default function LoginPage() {
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
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
