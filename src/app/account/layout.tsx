import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { AccountShell } from "@/components/account/account-shell";
import { VerifyBanner } from "@/components/account/verify-banner";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let s: Awaited<ReturnType<typeof getCurrentSession>> = null;
  try {
    s = await getCurrentSession();
  } catch (err) {
    // If Redis env is missing in local dev we can't auth — send to login with
    // a clear message rather than crashing the request.
    console.error("[account] redis unavailable", err);
    redirect("/login?redirect=/account");
  }
  if (!s) redirect("/login?redirect=/account");

  return (
    <AccountShell
      firstName={s.account.firstName}
      lastName={s.account.lastName}
      email={s.account.email}
    >
      {!s.account.emailVerified ? (
        <VerifyBanner email={s.account.email} />
      ) : null}
      {children}
    </AccountShell>
  );
}
