/**
 * Marketplace product detail page at /marketplace/[slug]. Dynamic
 * route with generateStaticParams over MARKETPLACE_PRODUCTS so each
 * shipped product is statically built. Unknown slugs fall through
 * to notFound(). Emits SoftwareApplication + BreadcrumbList JSON-LD
 * over the product entry.
 *
 * Canonical surface for Atelier at /marketplace/atelier; the legacy
 * /build-services/products/atelier page was deleted in v0.32.3.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";
import { MarketplaceProductShell } from "@/components/marketplace/marketplace-product-shell";
import {
  MARKETPLACE_PRODUCTS,
  getMarketplaceProductBySlug,
} from "@/lib/marketplace";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return MARKETPLACE_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getMarketplaceProductBySlug(slug);
  if (!product) return {};
  const title = `${product.name}: ${product.tagline}`;
  return {
    title: product.name,
    description: product.cardDescription,
    alternates: { canonical: `/marketplace/${product.slug}` },
    openGraph: {
      title,
      description: product.cardDescription,
      url: `/marketplace/${product.slug}`,
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.cardDescription,
    },
  };
}

export default async function MarketplaceProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getMarketplaceProductBySlug(slug);
  if (!product) notFound();

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    ...siteFreshness(),
    name: product.name,
    description: product.cardDescription,
    applicationCategory: product.category,
    operatingSystem: product.platform,
    url: `${SITE_URL}/marketplace/${product.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Dunamis Studios",
      "@id": `${SITE_URL}/#organization`,
    },
    offers: {
      "@type": "Offer",
      price: String(product.price),
      priceCurrency: "USD",
      category: "OneTimePurchase",
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Marketplace",
        item: `${SITE_URL}/marketplace`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/marketplace/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd
        id={`jsonld-marketplace-${product.slug}`}
        schema={softwareSchema}
      />
      <JsonLd
        id={`jsonld-marketplace-${product.slug}-breadcrumb`}
        schema={breadcrumbSchema}
      />
      <Container size="xl" className="pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Marketplace", href: "/marketplace" },
            { label: product.name },
          ]}
        />
      </Container>
      <MarketplaceProductShell product={product} />
    </>
  );
}
