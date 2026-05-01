import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

/**
 * Marketing layout is a plain server component now. SiteNav fetches
 * /api/auth/me from the client to render the signed-in / signed-out
 * affordance, which used to require this layout to be force-dynamic.
 * Removing the dynamic flag lets every static-buildable page in the
 * group emit real Cache-Control headers and pass bf-cache.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
