import type { Metadata } from "next";
import { LanePlaceholder } from "@/components/marketing/lane-placeholder";

export const metadata: Metadata = {
  title: "Build Services Courses",
  description:
    "Courses on scoping, buying, and shipping custom software. Coming soon from Dunamis Studios.",
  alternates: { canonical: "/build-services/courses" },
  openGraph: {
    title: "Build Services Courses · Dunamis Studios",
    description:
      "Courses on scoping, buying, and shipping custom software. Coming soon from Dunamis Studios.",
    url: "/build-services/courses",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Services Courses · Dunamis Studios",
    description:
      "Courses on scoping, buying, and shipping custom software. Coming soon from Dunamis Studios.",
  },
};

export default function BuildServicesCoursesPage() {
  return (
    <LanePlaceholder
      lane="build"
      laneLabel="Build Services"
      area="Courses"
      headline="Courses, coming soon"
      body="Practical material for the people on either side of a custom build — how to scope, what to ask for, what to write into a spec doc, what handover should actually include. Designed for buyers, not engineers."
      backHref="/build-services"
      contactHref="/build-services#contact"
    />
  );
}
