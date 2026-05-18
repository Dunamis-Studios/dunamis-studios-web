/**
 * Build Services guides placeholder at /build-services/guides.
 * Long-form content area; no guides shipped here yet. Uses the
 * shared LanePlaceholder shell. When guides ship under this lane,
 * replace with a listing page sourced from listPosts("guide",
 * lane="build-services") or equivalent.
 */
import type { Metadata } from "next";
import { LanePlaceholder } from "@/components/marketing/lane-placeholder";

export const metadata: Metadata = {
  title: "Build Services Guides",
  description:
    "Long-form guides on scoping, choosing, and running custom-build engagements. Coming soon from Dunamis Studios.",
  alternates: { canonical: "/build-services/guides" },
  openGraph: {
    title: "Build Services Guides · Dunamis Studios",
    description:
      "Long-form guides on scoping, choosing, and running custom-build engagements. Coming soon from Dunamis Studios.",
    url: "/build-services/guides",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Services Guides · Dunamis Studios",
    description:
      "Long-form guides on scoping, choosing, and running custom-build engagements. Coming soon from Dunamis Studios.",
  },
};

export default function BuildServicesGuidesPage() {
  return (
    <LanePlaceholder
      lane="build"
      laneLabel="Build Services"
      area="Guides"
      headline="Guides, coming soon"
      body="Reference-grade write-ups on the parts of a custom build that surprise buyers — discovery, hosting handover, post-launch support, scope creep, white-label structure with agencies. Long-form, opinionated, useful before signing anything."
      backHref="/build-services"
      contactHref="/build-services#contact"
    />
  );
}
