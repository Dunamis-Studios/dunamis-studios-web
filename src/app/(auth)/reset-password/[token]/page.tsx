import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Dunamis Studios account.",
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthCard
      title="Set a new password"
      description="Choose something you'll remember but a password manager would love."
      footer={
        <>
          Changed your mind?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <ResetForm token={token} />
    </AuthCard>
  );
}
