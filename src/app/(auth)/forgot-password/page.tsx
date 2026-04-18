import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Enter your email to receive a password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email on your account and we'll send a reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
