/**
 * Marketplace catalog index at /marketplace. Renders the
 * MarketplaceGrid with the full MARKETPLACE_PRODUCTS list and the
 * auto-derived platform / category filter dropdowns. Emits
 * ItemList JSON-LD over the products so search engines can index
 * the catalog.
 *
 * Atelier is the lone shipping product at launch; future prebuilt
 * apps are added by extending MARKETPLACE_PRODUCTS in
 * src/lib/marketplace.ts. The grid and detail page auto-pick them
 * up.
 */
import type { Metadata } from "next";
import { Container, Section } from "@/components/ui/primitives";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";
import { MarketplaceGrid } from "@/components/marketplace/marketplace-grid";
import {
  MARKETPLACE_PRODUCTS,
  getMarketplacePlatforms,
  getMarketplaceCategories,
} from "@/lib/marketplace";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  ...siteFreshness(),
  name: "Marketplace by Dunamis Studios",
  description:
    "Prebuilt apps and tools from Dunamis Studios. One-time purchase, customer owned, customer hosted.",
  url: `${SITE_URL}/marketplace`,
  publisher: {
    "@type": "Organization",
    name: "Dunamis Studios",
    "@id": `${SITE_URL}/#organization`,
  },
  mainEntity: {
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: MARKETPLACE_PRODUCTS.length,
    itemListElement: MARKETPLACE_PRODUCTS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: p.name,
        applicationCategory: p.category,
        operatingSystem: p.platform,
        url: `${SITE_URL}/marketplace/${p.slug}`,
        description: p.cardDescription,
        offers: {
          "@type": "Offer",
          price: String(p.price),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        publisher: {
          "@type": "Organization",
          name: "Dunamis Studios",
          "@id": `${SITE_URL}/#organization`,
        },
      },
    })),
  },
};

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Prebuilt apps and tools from Dunamis Studios. One-time purchase, customer owned, customer hosted.",
  alternates: { canonical: "/marketplace" },
  openGraph: {
    title: "Marketplace · Dunamis Studios",
    description:
      "Prebuilt apps and tools from Dunamis Studios. One-time purchase, customer owned, customer hosted.",
    url: "/marketplace",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Marketplace by Dunamis Studios",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace · Dunamis Studios",
    description:
      "Prebuilt apps and tools from Dunamis Studios. One-time purchase, customer owned, customer hosted.",
  },
};

export default function MarketplacePage() {
  const platforms = getMarketplacePlatforms();
  const categories = getMarketplaceCategories();

  return (
    <>
      <JsonLd id="jsonld-marketplace-collection" schema={collectionSchema} />
      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-20 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Marketplace
            </div>
            <h1 className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-[-0.02em] leading-[1.05] text-[var(--fg)] sm:text-5xl lg:text-6xl">
              Prebuilt apps and tools from Dunamis Studios.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--fg-muted)]">
              One-time purchase. Customer owned, customer hosted. No subscriptions, no telemetry, no kill switch.
            </p>
          </div>
        </Container>
      </div>

      <Section className="border-t border-[var(--border)] py-12 sm:py-16">
        <Container size="xl">
          <MarketplaceGrid
            products={MARKETPLACE_PRODUCTS}
            platforms={platforms}
            categories={categories}
          />
        </Container>
      </Section>
    </>
  );
}
