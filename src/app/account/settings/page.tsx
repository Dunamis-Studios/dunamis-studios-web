import type { Metadata } from "next";
import {
  DEFAULT_SESSION_LIFETIME_DAYS,
  getCurrentSession,
  listSessionsForAccount,
} from "@/lib/session";
import { PageHeader } from "@/components/ui/primitives";
import { ProfileSection } from "@/components/account/profile-section";
import { PasswordSection } from "@/components/account/password-section";
import { SessionsSection } from "@/components/account/sessions-section";
import { DangerZone } from "@/components/account/danger-zone";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account settings" };

export default async function SettingsPage() {
  const s = await getCurrentSession();
  if (!s) return null;
  const sessions = await listSessionsForAccount(s.account.accountId);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Account settings"
        description="Your profile, password, active sessions, and everything in between."
      />

      <div className="mt-10 space-y-10">
        <ProfileSection
          firstName={s.account.firstName}
          lastName={s.account.lastName}
          email={s.account.email}
          emailVerified={s.account.emailVerified}
        />
        <PasswordSection />
        <SessionsSection
          currentSessionId={s.session.sessionId}
          initialSessions={sessions}
          initialSessionLifetimeDays={
            s.account.sessionLifetimeDays ?? DEFAULT_SESSION_LIFETIME_DAYS
          }
        />
        <DangerZone />
      </div>
    </>
  );
}
