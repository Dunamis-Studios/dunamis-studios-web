import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getCurrentSession } from "@/lib/session";

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
