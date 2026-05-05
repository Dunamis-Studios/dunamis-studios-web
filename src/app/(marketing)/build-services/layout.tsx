import { LaneSubnav } from "@/components/marketing/lane-subnav";

/**
 * Build Services lane layout. Wraps the subtree in `lane-build` so
 * `--accent` / `--accent-fg` / `--ring` resolve to the build (purple)
 * tokens; renders the persistent lane subnav above the page content.
 */
export default function BuildServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lane-build">
      <LaneSubnav lane="build" />
      {children}
    </div>
  );
}
