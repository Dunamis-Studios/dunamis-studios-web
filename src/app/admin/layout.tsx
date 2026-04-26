import { redirect } from "next/navigation";
import { getCurrentSession, getCurrentAdminSession } from "@/lib/session";

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
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <a href="/admin/content" className="text-sm font-medium text-[var(--fg)]">
              Admin
            </a>
            <nav className="flex items-center gap-1">
              <a
                href="/admin/content"
                className="rounded-md px-3 py-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Content
              </a>
            </nav>
          </div>
          <a
            href="/"
            className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            Back to site
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
