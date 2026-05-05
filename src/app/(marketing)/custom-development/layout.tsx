import { LaneSubnav } from "@/components/marketing/lane-subnav";

/**
 * HubSpot Custom Development lane layout. Wraps the subtree in
 * `lane-hubspot` so `--accent` / `--accent-fg` / `--ring` resolve to
 * the HubSpot (orange) tokens; renders the persistent lane subnav
 * above the page content.
 */
export default function CustomDevelopmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lane-hubspot">
      <LaneSubnav lane="hubspot" />
      {children}
    </div>
  );
}
