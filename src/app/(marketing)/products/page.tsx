import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductStageBadge } from "@/components/marketing/product-stage-badge";
import {
  PRODUCT_CATALOG_SLUGS,
  PRODUCT_META,
  type ProductMeta,
  type ProductStage,
} from "@/lib/types";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const AVAILABLE_STAGES: ProductStage[] = ["beta", "coming-soon"];

const products = PRODUCT_CATALOG_SLUGS.map((slug) => PRODUCT_META[slug]);

const available = products.filter((p) => AVAILABLE_STAGES.includes(p.stage));
const inDevelopment = products.filter(
  (p) => !AVAILABLE_STAGES.includes(p.stage),
);

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "Products",
      item: `${SITE_URL}/products`,
    },
  ],
};

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Products by Dunamis Studios",
  description:
    "The full Dunamis Studios catalog of HubSpot apps and tools, including Property Pulse, Debrief, Carbon Copy, Traverse and Update, and Association Visualizer.",
  url: `${SITE_URL}/products`,
  publisher: {
    "@type": "Organization",
    name: "Dunamis Studios",
    "@id": `${SITE_URL}/#organization`,
  },
  mainEntity: {
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: p.name,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "CRM",
        operatingSystem: "Web-based",
        url: `${SITE_URL}${p.href}`,
        description: p.description,
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
  title: "Products by Dunamis Studios",
  description:
    "Every Dunamis Studios product in one place. Property Pulse for change history. Debrief for handoff briefs. Carbon Copy, Traverse and Update, and Association Visualizer in earlier stages.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Products by Dunamis Studios",
    description:
      "Every Dunamis Studios product in one place. Property Pulse for change history. Debrief for handoff briefs. Carbon Copy, Traverse and Update, and Association Visualizer in earlier stages.",
    url: "/products",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Products by Dunamis Studios",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Products by Dunamis Studios",
    description:
      "Every Dunamis Studios product in one place. Property Pulse for change history. Debrief for handoff briefs. Carbon Copy, Traverse and Update, and Association Visualizer in earlier stages.",
  },
};

export default function ProductsIndexPage() {
  return (
    <>
      <JsonLd id="jsonld-products-collection" schema={collectionSchema} />
      <JsonLd id="jsonld-products-breadcrumb" schema={breadcrumbSchema} />

      <Container size="xl" className="pt-6">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Products" }]}
        />
      </Container>

      {/* HERO */}
      <Section className="pb-10 sm:pb-14">
        <Container size="xl">
          <div className="max-w-3xl">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Products
            </div>
            <h1 className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-[-0.02em] leading-[1.05] text-[var(--fg)] sm:text-5xl lg:text-6xl">
              The Dunamis Studios catalog.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--fg-muted)]">
              Every product we ship, in one place. Each one earns its weight by
              solving one specific HubSpot problem end to end. Some are live in
              the marketplace. Some are built and on the way. A couple are
              still earlier ideas we&apos;re working on in public.
            </p>
          </div>
        </Container>
      </Section>

      {/* AVAILABLE */}
      <Section className="border-t border-[var(--border)] py-12 sm:py-16">
        <Container size="xl">
          <SectionHeader
            eyebrow="Available"
            heading="Live in marketplace, or close to it."
            blurb="Property Pulse is live with capped beta installs while marketplace review wraps. Debrief is built and waiting on the marketplace listing."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {available.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Container>
      </Section>

      {/* IN DEVELOPMENT */}
      <Section className="border-t border-[var(--border)] py-12 sm:py-16">
        <Container size="xl">
          <SectionHeader
            eyebrow="In development"
            heading="Built or being built. Not on the marketplace yet."
            blurb="Carbon Copy and Traverse and Update are working code waiting on listings. Association Visualizer is an internal tool we're deciding whether to open up."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {inDevelopment.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}

function SectionHeader({
  eyebrow,
  heading,
  blurb,
}: {
  eyebrow: string;
  heading: string;
  blurb: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        {eyebrow}
      </div>
      <h2 className="mt-3 font-[var(--font-display)] text-2xl font-medium tracking-tight text-[var(--fg)] sm:text-3xl">
        {heading}
      </h2>
      <p className="mt-4 leading-relaxed text-[var(--fg-muted)]">{blurb}</p>
    </div>
  );
}

function ProductCard({ product }: { product: ProductMeta }) {
  return (
    <Link
      href={product.href}
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 transition-colors hover:border-[var(--border-strong)]"
    >
      <div className="flex items-center justify-between gap-3">
        <ProductStageBadge stage={product.stage} />
        <span className="text-xs text-[var(--fg-subtle)]">
          {product.pricingModel}
        </span>
      </div>
      <h3 className="mt-5 font-[var(--font-display)] text-xl font-medium tracking-tight text-[var(--fg)]">
        {product.name}
      </h3>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">{product.tagline}</p>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--fg-muted)]">
        {product.description}
      </p>
      <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--fg)] transition-transform group-hover:translate-x-0.5">
        Learn more
        <ArrowRight className="h-4 w-4" aria-hidden />
      </div>
    </Link>
  );
}
