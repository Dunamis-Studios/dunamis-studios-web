import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyClient } from "./verify-client";

export const metadata: Metadata = {
  title: "Verifying email",
  description: "Confirming your email address.",
};

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthCard title="Verifying your email">
      <VerifyClient token={token} />
    </AuthCard>
  );
}
