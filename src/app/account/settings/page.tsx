/**
 * /account/settings: composite settings page assembled from per-area
 * client components (profile, brand logo upload, password change,
 * active sessions list, data export, danger zone). The server-side
 * job here is narrow: resolve the session, look up the active
 * sessions list once for the SessionsSection, and pass each
 * subsection its slice of the account record.
 *
 * The danger zone owns account-deletion flow; data export owns the
 * GDPR-style data download. Both live in components/account/* so
 * the page itself stays readable.
 */
import type { Metadata } from "next";
import {
  DEFAULT_SESSION_LIFETIME_DAYS,
  getCurrentSession,
  listSessionsForAccount,
} from "@/lib/session";
import { PageHeader } from "@/components/ui/primitives";
import { ProfileSection } from "@/components/account/profile-section";
import { LogoSection } from "@/components/account/logo-section";
import { PasswordSection } from "@/components/account/password-section";
import { SessionsSection } from "@/components/account/sessions-section";
import { DangerZone } from "@/components/account/danger-zone";
import { DataExportSection } from "@/components/account/data-export-section";
import { listIanaTimeZones } from "@/lib/timezones";

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
          companyName={s.account.companyName ?? null}
          timeZone={s.account.timeZone ?? null}
          email={s.account.email}
          emailVerified={s.account.emailVerified}
          timeZoneOptions={listIanaTimeZones()}
        />
        <LogoSection logoUrl={s.account.logoUrl ?? null} />
        <PasswordSection />
        <SessionsSection
          currentSessionId={s.session.sessionId}
          initialSessions={sessions}
          initialSessionLifetimeDays={
            s.account.sessionLifetimeDays ?? DEFAULT_SESSION_LIFETIME_DAYS
          }
        />
        <DataExportSection />
        <DangerZone />
      </div>
    </>
  );
}
