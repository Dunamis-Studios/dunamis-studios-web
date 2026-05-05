import type { Metadata } from "next";
import { LanePlaceholder } from "@/components/marketing/lane-placeholder";

export const metadata: Metadata = {
  title: "Build Services Products",
  description:
    "Productized custom builds from Dunamis Studios. Coming soon — for now every Build Services engagement is bespoke and starts with paid discovery.",
  alternates: { canonical: "/build-services/products" },
  openGraph: {
    title: "Build Services Products · Dunamis Studios",
    description:
      "Productized custom builds from Dunamis Studios. Coming soon — for now every Build Services engagement is bespoke and starts with paid discovery.",
    url: "/build-services/products",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Services Products · Dunamis Studios",
    description:
      "Productized custom builds from Dunamis Studios. Coming soon — for now every Build Services engagement is bespoke and starts with paid discovery.",
  },
};

export default function BuildServicesProductsPage() {
  return (
    <LanePlaceholder
      lane="build"
      laneLabel="Build Services"
      area="Products"
      headline="Productized builds, coming soon"
      body="Today, every Build Services engagement is custom and quoted from a spec doc after paid discovery. Productized offerings — repeatable builds we ship at a fixed price without a discovery phase — are on the roadmap."
      backHref="/build-services"
      contactHref="/build-services#contact"
    />
  );
}
