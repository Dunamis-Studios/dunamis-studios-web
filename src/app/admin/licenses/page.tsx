import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/lib/session";
import { listLicensesByProduct } from "@/lib/atelier-license-signing";
import { LicensesAdminClient } from "@/components/admin/licenses-admin-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Atelier licenses · Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin license issuance page.
 *
 * Server component: gates on admin session (the parent /admin layout
 * already handles redirect/forbidden, but this page also pulls the
 * session for context that the client component uses to display
 * "Issued by …"). Loads every Atelier license via
 * listLicensesByProduct("atelier") and hands the result to a client
 * component that renders the issuance form, the licenses table,
 * filters, search, and per-row actions.
 *
 * The list is loaded on every request — Atelier license counts will
 * stay small enough during v1 manual issuance that scanning the
 * product index is fine. If the list grows past a few hundred, the
 * load can shift to client-side pagination against a paged API.
 */
export default async function LicensesAdminPage() {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    // The parent layout handles the redirect, but TypeScript can't
    // see through that without an explicit narrowing here.
    redirect("/login?redirect=/admin/licenses");
  }

  const licenses = await listLicensesByProduct("atelier");
  // Sort by issued_at descending — newest first. Strings are ISO-8601
  // so lexicographic sort works correctly without parsing.
  const sorted = [...licenses].sort((a, b) =>
    a.issued_at < b.issued_at ? 1 : -1,
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-[var(--font-display)] text-3xl font-medium tracking-tight text-[var(--fg)]">
          Atelier licenses
        </h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Issue, resend, and mark licenses. Signing happens against
          ATELIER_LICENSE_SIGNING_PRIVATE_KEY in the server env.
          Records persist to Upstash under <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs">dunamis:atelier-license:*</code>.
        </p>
      </header>

      <LicensesAdminClient
        initialLicenses={sorted}
        adminEmail={admin.account.email}
      />
    </div>
  );
}
