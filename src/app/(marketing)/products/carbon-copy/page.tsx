import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductPageComingSoonShell } from "@/components/marketing/product-page-coming-soon-shell";
import { siteFreshness } from "@/lib/schema-freshness";
import { PRODUCT_META } from "@/lib/types";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";
const meta = PRODUCT_META["carbon-copy"];

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
    {
      "@type": "ListItem",
      position: 3,
      name: meta.name,
      item: `${SITE_URL}${meta.href}`,
    },
  ],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  ...siteFreshness(),
  name: meta.name,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "CRM",
  operatingSystem: "Web-based",
  description:
    "Carbon Copy is a HubSpot workflow action that wraps the Single-Send transactional email API and adds CC and BCC envelope support, including HubSpot personalization tokens and reply-to override. Built and deployed; HubSpot marketplace listing in progress.",
  url: `${SITE_URL}${meta.href}`,
  publisher: {
    "@type": "Organization",
    name: "Dunamis Studios",
    "@id": `${SITE_URL}/#organization`,
  },
  offers: {
    "@type": "Offer",
    availability: "https://schema.org/PreOrder",
    priceCurrency: "USD",
  },
};

export const metadata: Metadata = {
  title: "Carbon Copy: CC and BCC for HubSpot",
  description:
    "A HubSpot workflow action that adds CC and BCC envelope support to Single-Send transactional emails. Built and deployed, marketplace listing in progress.",
  alternates: { canonical: meta.href },
  openGraph: {
    title: "Carbon Copy: CC and BCC for HubSpot",
    description:
      "A HubSpot workflow action that adds CC and BCC envelope support to Single-Send transactional emails. Built and deployed, marketplace listing in progress.",
    url: meta.href,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Carbon Copy by Dunamis Studios",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carbon Copy: CC and BCC for HubSpot",
    description:
      "A HubSpot workflow action that adds CC and BCC envelope support to Single-Send transactional emails. Built and deployed, marketplace listing in progress.",
  },
};

export default function CarbonCopyPage() {
  return (
    <>
      <JsonLd id="jsonld-carbon-copy" schema={softwareSchema} />
      <JsonLd
        id="jsonld-carbon-copy-breadcrumb"
        schema={breadcrumbSchema}
      />

      <Container size="xl" className="pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: meta.name },
          ]}
        />
      </Container>

      <ProductPageComingSoonShell
        productSlug="carbon-copy"
        productName={meta.name}
        stage={meta.stage}
        tagline={meta.tagline}
        lede="HubSpot's native Single-Send Email workflow action takes a single recipient: the enrolled object. There is no native way to add CC or BCC recipients to a transactional email from a workflow. Carbon Copy fixes that one missing field."
        problem={{
          title: "One recipient is not how transactional email actually works.",
          body:
            "Real transactional emails get CC'd to a manager, BCC'd to an archive, and routed through a reply-to that points at the team inbox, not the sender's personal address. HubSpot's Single-Send Email workflow action exposes none of that: one recipient, no CC, no BCC, no reply-to override. Teams either drop the workflow and send manually, or build a custom code action that re-implements the transactional API.",
        }}
        whatWereBuilding={{
          title: "A workflow action that adds the missing envelope fields.",
          body:
            "Carbon Copy is a workflow action you drop into any HubSpot workflow on Contact, Company, Deal, or Ticket. It takes a Single-Send template ID, an optional CC list, an optional BCC list, and an optional reply-to override. CC and BCC accept semicolon-separated email lists with HubSpot personalization tokens. The action calls the Single-Send API directly and surfaces the send status as a workflow output so downstream branches can react to success or failure.",
        }}
        whereWeAre={{
          title: "Built and deployed. Marketplace listing in progress.",
          body:
            "The action is in production on Vercel and signs every webhook with HubSpot's v3 signature scheme. The HubSpot marketplace listing is being filled out (support contact, screenshots, billing terms). Carbon Copy requires the HubSpot Transactional Email add-on or Marketing Hub Enterprise; the action probes the portal's granted scopes during token refresh and fails cleanly if the add-on is not active.",
        }}
        notifyHeadline="Tell me when Carbon Copy hits the marketplace."
        notifyBody="One email when the listing goes live and Carbon Copy is installable from inside HubSpot."
      />
    </>
  );
}
