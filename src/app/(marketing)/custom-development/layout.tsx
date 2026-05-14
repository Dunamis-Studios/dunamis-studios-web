import { notFound } from "next/navigation";
import { LaneSubnav } from "@/components/marketing/lane-subnav";
import { FEATURE_FLAGS } from "@/lib/feature-flags";

/**
 * HubSpot Custom Development lane layout. Wraps the subtree in
 * `lane-hubspot` so `--accent` / `--accent-fg` / `--ring` resolve to
 * the HubSpot (orange) tokens; renders the persistent lane subnav
 * above the page content.
 *
 * When the hubspotSurfacesVisible flag is off, the entire lane
 * (overview, products, tools, courses, articles, guides, pricing)
 * 404s at this layout. Individual page-level gates are unnecessary;
 * Next applies layout gates to every nested route.
 */
export default function CustomDevelopmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!FEATURE_FLAGS.hubspotSurfacesVisible) {
    notFound();
  }
  return (
    <div className="lane-hubspot">
      <LaneSubnav lane="hubspot" />
      {children}
    </div>
  );
}
