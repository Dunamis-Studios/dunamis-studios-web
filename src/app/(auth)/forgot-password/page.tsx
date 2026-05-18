/**
 * Route entry for /forgot-password. Renders the AuthCard chrome and
 * a link back to /login, then mounts ForgotForm for the email input.
 * Marked noindex + nofollow because the surface only exists to start
 * a transactional reset email flow.
 *
 * The page is fully static; whether an email matches an account is
 * never disclosed in the UI, so there is no per-request branching.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Enter your email to receive a password reset link.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email on your account and we'll send a reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="text-[var(--accent)] underline">
            Sign in
          </Link>
        </>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
