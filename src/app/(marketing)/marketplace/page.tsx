import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  ...siteFreshness(),
  name: "Marketplace",
  description:
    "Dunamis Studios apps and tools. The full marketplace is coming soon.",
  url: `${SITE_URL}/marketplace`,
  isPartOf: {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
  },
  publisher: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
  },
};

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Dunamis Studios apps and tools. The full marketplace is coming soon.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    title: "Marketplace · Dunamis Studios",
    description:
      "Dunamis Studios apps and tools. The full marketplace is coming soon.",
    url: "/marketplace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace · Dunamis Studios",
    description:
      "Dunamis Studios apps and tools. The full marketplace is coming soon.",
  },
};

export default function MarketplacePage() {
  return (
    <>
      <JsonLd id="jsonld-marketplace-webpage" schema={webPageSchema} />
      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center stagger">
            <Badge className="mx-auto">Coming soon</Badge>
            <h1 className="mt-6 font-[var(--font-display)] text-5xl font-medium tracking-[-0.03em] leading-[1.02] text-[var(--fg)] sm:text-6xl lg:text-7xl">
              Marketplace
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Dunamis Studios apps and tools. Coming soon.
            </p>
          </div>
        </Container>
      </div>
      <Section />
    </>
  );
}
