import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import { getEntitlementsForAccount } from "@/lib/accounts";
import { listLicensesByEmail } from "@/lib/atelier-license-signing";
import { PageHeader } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EntitlementsTable } from "@/components/account/entitlements-table";
import { AtelierLicensesSection } from "@/components/account/atelier-licenses-section";
import { PRODUCT_META } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AccountDashboard() {
  const s = await getCurrentSession();
  // Layout has already guarded; narrow for TS:
  if (!s) return null;
  // Two distinct indexes back the dashboard: HubSpot entitlements
  // (per-portal subscriptions for Property Pulse / Debrief) live under
  // the account id; Atelier perpetual licenses live under a hashed
  // email key. Both surface here so the customer sees every Dunamis
  // purchase in one place. Empty section is hidden per side.
  const [entitlements, atelierLicenses] = await Promise.all([
    getEntitlementsForAccount(s.account.accountId),
    listLicensesByEmail(s.account.email),
  ]);

  const showEmptyState =
    entitlements.length === 0 && atelierLicenses.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Hey, ${s.account.firstName}.`}
        description="Every Dunamis Studios product you own, in one place. HubSpot apps appear when you install them; software licenses appear when you purchase them."
      />

      <div className="mt-10">
        {showEmptyState ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="You don't have any Dunamis Studios products yet."
            description="HubSpot apps appear here when you install them from the marketplace. Software licenses (like Atelier) appear here when you purchase them."
            action={
              <>
                <Button asChild>
                  <a
                    href={PRODUCT_META["property-pulse"].marketplaceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Install Property Pulse
                  </a>
                </Button>
                <Button asChild variant="secondary">
                  <a
                    href={PRODUCT_META.debrief.marketplaceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Install Debrief
                  </a>
                </Button>
              </>
            }
          />
        ) : (
          <>
            {entitlements.length > 0 && (
              <section aria-labelledby="hubspot-section-heading">
                <header className="mb-4">
                  <h2
                    id="hubspot-section-heading"
                    className="text-sm font-medium uppercase tracking-wider text-[var(--fg-subtle)]"
                  >
                    HubSpot apps
                  </h2>
                </header>
                <EntitlementsTable entitlements={entitlements} />
              </section>
            )}
            {atelierLicenses.length > 0 && (
              <AtelierLicensesSection licenses={atelierLicenses} />
            )}
          </>
        )}
      </div>
    </>
  );
}
