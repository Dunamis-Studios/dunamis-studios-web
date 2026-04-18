import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getCurrentSession } from "@/lib/session";

// Layout probes the session cookie for signed-in nav state, which means
// every page inside this group is dynamic.
export const dynamic = "force-dynamic";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let signedIn = false;
  let firstName: string | undefined;
  try {
    const s = await getCurrentSession();
    if (s) {
      signedIn = true;
      firstName = s.account.firstName;
    }
  } catch {
    // Redis may not be configured in local dev — nav falls back to signed-out.
  }
  return (
    <>
      <SiteNav signedIn={signedIn} firstName={firstName} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
