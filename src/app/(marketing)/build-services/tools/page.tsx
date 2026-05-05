import type { Metadata } from "next";
import { LanePlaceholder } from "@/components/marketing/lane-placeholder";

export const metadata: Metadata = {
  title: "Build Services Free Tools",
  description:
    "Free tools and calculators for custom-software buyers. Coming soon — scope estimators, build/buy decision aids, and infrastructure cost models.",
  alternates: { canonical: "/build-services/tools" },
  openGraph: {
    title: "Build Services Free Tools · Dunamis Studios",
    description:
      "Free tools and calculators for custom-software buyers. Coming soon — scope estimators, build/buy decision aids, and infrastructure cost models.",
    url: "/build-services/tools",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Services Free Tools · Dunamis Studios",
    description:
      "Free tools and calculators for custom-software buyers. Coming soon — scope estimators, build/buy decision aids, and infrastructure cost models.",
  },
};

export default function BuildServicesToolsPage() {
  return (
    <LanePlaceholder
      lane="build"
      laneLabel="Build Services"
      area="Free Tools"
      headline="Free tools, coming soon"
      body="Calculators and estimators for the people scoping custom builds — build/buy decision aids, scope-band sizers, hosting cost models. Useful before you talk to anyone, including us."
      backHref="/build-services"
      contactHref="/build-services#contact"
    />
  );
}
