import { redirect } from "next/navigation";

import { getCurrentAdminSession } from "@/lib/session";
import { CustomersSearchClient } from "@/components/admin/customers-search-client";
import { listRecentCustomers } from "@/lib/admin/recent-customers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customers · Admin · Dunamis Studios",
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage() {
  const admin = await getCurrentAdminSession();
  if (!admin) {
    redirect("/login?redirect=/admin/customers");
  }

  const recent = await listRecentCustomers(10);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[var(--font-display)] text-3xl font-medium tracking-tight text-[var(--fg)]">
          Customers
        </h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Search by email. Selecting a result opens that customer&apos;s account
          with their licenses, devices, EULA acceptances, and audit history.
        </p>
      </header>

      <CustomersSearchClient recent={recent} />
    </div>
  );
}
