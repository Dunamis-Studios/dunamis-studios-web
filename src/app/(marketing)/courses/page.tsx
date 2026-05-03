import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, GraduationCap } from "lucide-react";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const TITLE = "Courses";
const DESCRIPTION =
  "Free email courses for HubSpot operators. Each course is one focused topic, delivered one email per day, with a specific action to take each day. No fluff, no pitch.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/courses" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/courses",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${TITLE} · Dunamis Studios`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: `${TITLE} · Dunamis Studios`,
      },
    ],
  },
};

interface CourseEntry {
  href: string;
  title: string;
  description: string;
  /** Short readable cadence (e.g. "5 emails, 1 per day"). */
  cadence: string;
  badge?: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

const COURSES: CourseEntry[] = [
  {
    href: "/courses/hubspot-audit",
    title: "5-Day HubSpot Audit",
    description:
      "Audit your portal in five days. One email per day, each one covering a different dimension: properties, workflows, pipeline, scoring and lifecycle, and team setup. Each day ends with a specific action to take.",
    cadence: "5 emails, 1 per day",
    Icon: GraduationCap,
    badge: "New",
  },
];

function buildCollectionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    ...siteFreshness(),
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/courses`,
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
    },
    hasPart: COURSES.map((c) => ({
      "@type": "Course",
      name: c.title,
      description: c.description,
      url: `${SITE_URL}${c.href}`,
      provider: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
      },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    })),
  };
}

export default function CoursesPage() {
  return (
    <>
      <JsonLd id="jsonld-courses-index" schema={buildCollectionSchema()} />
      <Section>
        <Container>
          <PageHeader
            eyebrow="Courses"
            title="Free email courses"
            description={DESCRIPTION}
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((course) => {
              const { Icon } = course;
              return (
                <Link
                  key={course.href}
                  href={course.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 transition-colors hover:border-[var(--border-strong)]"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] text-[var(--color-brand-400)]"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    {course.badge ? (
                      <span className="inline-flex items-center rounded-md border border-[color-mix(in_oklch,var(--color-brand-500)_50%,transparent)] bg-[color-mix(in_oklch,var(--color-brand-500)_15%,transparent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-brand-400)]">
                        {course.badge}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-[var(--font-display)] text-lg font-medium tracking-tight text-[var(--fg)]">
                        {course.title}
                      </h2>
                      <ArrowUpRight
                        className="h-5 w-5 shrink-0 text-[var(--fg-subtle)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--fg)]"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                      {course.description}
                    </p>
                    <p className="mt-3 font-mono text-xs text-[var(--fg-subtle)]">
                      {course.cadence}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>
    </>
  );
}
