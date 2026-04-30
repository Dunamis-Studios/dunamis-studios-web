import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductPageComingSoonShell } from "@/components/marketing/product-page-coming-soon-shell";
import { PRODUCT_META } from "@/lib/types";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";
const meta = PRODUCT_META["association-visualizer"];

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
  name: meta.name,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "CRM",
  operatingSystem: "Web-based",
  description:
    "Association Visualizer renders a CRM record's outbound associations as a two-hop tree, with an inline SVG card on the record and a full-size diagram with a clickable list of related records on click. Currently a private internal tool we are exploring as a public Dunamis Studios product.",
  url: `${SITE_URL}${meta.href}`,
  publisher: {
    "@type": "Organization",
    name: "Dunamis Studios",
    "@id": `${SITE_URL}/#organization`,
  },
};

export const metadata: Metadata = {
  title: "Association Visualizer: Two-hop CRM relationship maps",
  description:
    "An internal Dunamis Studios tool that renders a HubSpot CRM record's outbound associations as a two-hop tree. We're exploring whether to ship it as a public product.",
  alternates: { canonical: meta.href },
  openGraph: {
    title: "Association Visualizer: Two-hop CRM relationship maps",
    description:
      "An internal Dunamis Studios tool that renders a HubSpot CRM record's outbound associations as a two-hop tree. We're exploring whether to ship it as a public product.",
    url: meta.href,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Association Visualizer by Dunamis Studios",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Association Visualizer: Two-hop CRM relationship maps",
    description:
      "An internal Dunamis Studios tool that renders a HubSpot CRM record's outbound associations as a two-hop tree. We're exploring whether to ship it as a public product.",
  },
};

export default function AssociationVisualizerPage() {
  return (
    <>
      <JsonLd
        id="jsonld-association-visualizer"
        schema={softwareSchema}
      />
      <JsonLd
        id="jsonld-association-visualizer-breadcrumb"
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
        productSlug="association-visualizer"
        productName={meta.name}
        stage={meta.stage}
        tagline={meta.tagline}
        lede="HubSpot's native association display is a flat list per object type. There is no visual sense of how a single record sits inside the web of contacts, companies, deals, tickets, line items, and quotes around it. Association Visualizer gives that web a shape."
        problem={{
          title: "Flat lists hide how records actually connect.",
          body:
            "Inside HubSpot, a record's associations are split across separate panels by object type, paginated, and sorted independently. Walking a relationship two hops out (the contacts on a deal's company, the deals attached to a ticket's contact) means clicking through several panels and holding the structure in your head. The data is all there. The picture is not.",
        }}
        whatWereBuilding={{
          title: "A two-hop association tree, rendered on the record.",
          body:
            "Association Visualizer is a CRM card that draws a record's outbound associations two hops out as a tree. The card shows a compact inline SVG thumbnail next to a clickable list of related records, and a full-size diagram opens in a modal. Records are grouped by object type with a per-type cap and a +N more pill so the picture stays legible on busy records. Read-only by design: no edits, no association rewiring, no deletions.",
        }}
        whereWeAre={{
          title: "Internal tool today.",
          body:
            "The card is built and running inside the Dunamis Studios HubSpot portal as a private app. It supports contacts, companies, deals, tickets, line items, and quotes. We are deciding whether to clean it up for marketplace release or keep it as a private tool that ships with our custom-development engagements. If you want to be told when we make that call, drop your email below.",
        }}
        notifyHeadline="Tell me when this becomes public."
        notifyBody="One email if and when Association Visualizer becomes a marketplace product. No newsletter."
      />
    </>
  );
}
