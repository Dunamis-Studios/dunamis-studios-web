/**
 * Route entry for /reset-password/[token]. The token is the opaque
 * id from the reset email; it stays in the URL path and is forwarded
 * to ResetForm where the actual POST happens. The page itself does
 * no token validation since giving the client distinct "invalid" /
 * "expired" / "consumed" states up front would leak whether a token
 * exists at all. Marked noindex + nofollow.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Dunamis Studios account.",
  robots: { index: false, follow: false },
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
          <Link href="/login" className="text-[var(--accent)] underline">
            Sign in
          </Link>
        </>
      }
    >
      <ResetForm token={token} />
    </AuthCard>
  );
}
