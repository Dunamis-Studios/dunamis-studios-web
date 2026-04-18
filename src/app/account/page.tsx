import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { getCurrentSession } from "@/lib/session";
import { getEntitlementsForAccount } from "@/lib/accounts";
import { PageHeader } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EntitlementsTable } from "@/components/account/entitlements-table";
import { PRODUCT_META } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AccountDashboard() {
  const s = await getCurrentSession();
  // Layout has already guarded; narrow for TS:
  if (!s) return null;
  const entitlements = await getEntitlementsForAccount(s.account.accountId);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Hey, ${s.account.firstName}.`}
        description="Every Dunamis Studios app you've installed, across every HubSpot portal you admin. One place, one source of truth."
      />

      <div className="mt-10">
        {entitlements.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="You haven't installed any Dunamis apps yet."
            description="Your entitlements will appear here automatically when you install Property Pulse or Debrief from the HubSpot marketplace."
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
          <EntitlementsTable entitlements={entitlements} />
        )}
      </div>
    </>
  );
}
