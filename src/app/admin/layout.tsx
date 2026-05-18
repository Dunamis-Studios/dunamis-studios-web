/**
 * Two-gate auth wrapper for every /admin/* route. First requires a
 * valid session (redirect to /login on miss or on Redis outage),
 * then requires that session's account to also satisfy the admin
 * check (Forbidden render on miss). Wraps approved routes in the
 * admin chrome plus a timezone provider so timestamps across the
 * admin tools render in the admin's saved preference.
 *
 * Force-dynamic for the same reason as the /account layout: this
 * reads cookies on every request and cannot be prerendered.
 */
import { redirect } from "next/navigation";
import { getCurrentSession, getCurrentAdminSession } from "@/lib/session";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminTimezoneProvider } from "@/components/admin/admin-timezone-provider";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: Awaited<ReturnType<typeof getCurrentSession>> = null;
  try {
    session = await getCurrentSession();
  } catch (err) {
    console.error("[admin] redis unavailable", err);
    redirect("/login?redirect=/admin");
  }

  if (!session) {
    redirect("/login?redirect=/admin");
  }

  const admin = await getCurrentAdminSession();
  if (!admin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-[var(--fg)]">Forbidden</h1>
          <p className="mt-2 text-[var(--fg-muted)]">
            Your account does not have admin access.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AdminTimezoneProvider
      preferredTimeZone={admin.account.timeZone ?? null}
    >
      <div className="min-h-screen bg-[var(--bg)]">
        <AdminHeader
          adminFirstName={admin.account.firstName ?? null}
          adminEmail={admin.account.email}
        />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AdminTimezoneProvider>
  );
}
