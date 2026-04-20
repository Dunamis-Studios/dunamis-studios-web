import type { Metadata } from "next";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SearchBox } from "../_components/SearchBox";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const title = q ? `Search results for "${q}"` : "Search the help center";
  const description = q
    ? `Help-center articles matching "${q}" across Debrief, Property Pulse, and the Dunamis Studios platform.`
    : "Search Dunamis Studios help-center articles. The search runs in your browser; the query never leaves your device.";
  return {
    title,
    description,
    alternates: { canonical: "/help/search" },
    robots: { index: false, follow: true },
    openGraph: {
      title: q
        ? `${title} — Dunamis Studios`
        : "Search — Dunamis Studios help center",
      description,
      url: "/help/search",
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Dunamis Studios help center",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: q
        ? `${title} — Dunamis Studios`
        : "Search — Dunamis Studios help center",
      description,
      images: [
        {
          url: "/twitter-image",
          width: 1200,
          height: 630,
          alt: "Dunamis Studios help center",
        },
      ],
    },
  };
}

export default async function HelpSearchPage({
  searchParams,
}: SearchPageProps) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";

  return (
    <Section>
      <Container size="lg">
        <Breadcrumbs
          items={[{ label: "Help", href: "/help" }, { label: "Search" }]}
          className="mb-5"
        />
        <PageHeader
          title={q ? `Search results for \u201C${q}\u201D` : "Search the help center"}
          description="Search runs in your browser. The query never leaves your device."
        />
        <div className="mt-8 max-w-2xl">
          <SearchBox initialQuery={q} eager />
        </div>
      </Container>
    </Section>
  );
}
