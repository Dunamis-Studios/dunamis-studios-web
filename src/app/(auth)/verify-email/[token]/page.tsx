/**
 * Route entry for /verify-email/[token]. The token comes from the
 * verification email link; the page hands it to VerifyClient which
 * fires the actual POST on mount. The server-side render is just
 * the AuthCard chrome plus a placeholder title so first paint shows
 * "Verifying your email" before the client-side fetch resolves.
 * Marked noindex + nofollow.
 */
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyClient } from "./verify-client";

export const metadata: Metadata = {
  title: "Verifying email",
  description: "Confirming your email address.",
  robots: { index: false, follow: false },
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
