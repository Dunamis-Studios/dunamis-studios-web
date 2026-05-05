import type { Metadata } from "next";
import { LanePlaceholder } from "@/components/marketing/lane-placeholder";

export const metadata: Metadata = {
  title: "Build Services Articles",
  description:
    "Short-form posts on custom software development, white-label engagements, and shipping internal tools. Coming soon from Dunamis Studios.",
  alternates: { canonical: "/build-services/articles" },
  openGraph: {
    title: "Build Services Articles · Dunamis Studios",
    description:
      "Short-form posts on custom software development, white-label engagements, and shipping internal tools. Coming soon from Dunamis Studios.",
    url: "/build-services/articles",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Services Articles · Dunamis Studios",
    description:
      "Short-form posts on custom software development, white-label engagements, and shipping internal tools. Coming soon from Dunamis Studios.",
  },
};

export default function BuildServicesArticlesPage() {
  return (
    <LanePlaceholder
      lane="build"
      laneLabel="Build Services"
      area="Articles"
      headline="Articles, coming soon"
      body="Shorter posts on the realities of custom software work — what we learned shipping a particular build, what kept breaking, when build/buy goes the other way. Written for the people running the project, not the people writing the code."
      backHref="/build-services"
      contactHref="/build-services#contact"
    />
  );
}
