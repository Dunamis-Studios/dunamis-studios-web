import type { Metadata } from "next";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductPageComingSoonShell } from "@/components/marketing/product-page-coming-soon-shell";
import { PRODUCT_META } from "@/lib/types";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";
const meta = PRODUCT_META["traverse-and-update"];

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
    "Traverse and Update is a HubSpot workflow action that updates any writable property on records exactly two outbound association hops away from the enrolled object. Optional association-label filters on each hop and a CRM Search prefilter to narrow the target set. Fully built; not yet on the marketplace.",
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
  title: "Traverse and Update: Two-hop property updates for HubSpot",
  description:
    "A HubSpot workflow action that updates properties on records two outbound association hops away. Optional association-label filters and CRM Search prefiltering. Built; not yet on the marketplace.",
  alternates: { canonical: meta.href },
  openGraph: {
    title: "Traverse and Update: Two-hop property updates for HubSpot",
    description:
      "A HubSpot workflow action that updates properties on records two outbound association hops away. Optional association-label filters and CRM Search prefiltering. Built; not yet on the marketplace.",
    url: meta.href,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Traverse and Update by Dunamis Studios",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Traverse and Update: Two-hop property updates for HubSpot",
    description:
      "A HubSpot workflow action that updates properties on records two outbound association hops away. Optional association-label filters and CRM Search prefiltering. Built; not yet on the marketplace.",
  },
};

export default function TraverseAndUpdatePage() {
  return (
    <>
      <JsonLd
        id="jsonld-traverse-and-update"
        schema={softwareSchema}
      />
      <JsonLd
        id="jsonld-traverse-and-update-breadcrumb"
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
        productSlug="traverse-and-update"
        productName={meta.name}
        stage={meta.stage}
        tagline={meta.tagline}
        lede="HubSpot's native Set Property workflow action stops at one association hop. Traverse and Update walks the next hop for you, with association-label filters at every step."
        problem={{
          title: "Native workflows can't reach two hops out.",
          body:
            "HubSpot's Set Property workflow action targets the enrolled record or, with the cross-object set, a record one association hop away. There is no way to update a property on a record two hops out, no way to filter by association label across hops, and no way to narrow the target set with a property filter before writing. Teams that need any of those build custom-code actions and maintain them by hand.",
        }}
        whatWereBuilding={{
          title: "A workflow action that walks two hops and writes safely.",
          body:
            "Traverse and Update is a workflow action that takes the enrolled record, walks one outbound association hop to an intermediate object, walks a second hop to the target object, then updates a property on every record in the target set. Each hop accepts optional association-label filters so the walk is constrained to specific labeled relationships. An optional CRM Search prefilter narrows the target set across thirteen operator types before any write happens. Writes are batched in groups of ten with exponential backoff on rate-limited responses.",
        }}
        whereWeAre={{
          title: "Fully built. Marketplace listing pending.",
          body:
            "The action ships with OAuth, signature validation, batched execution, and a settings page with a per-portal silent-failure toggle and a connection status display. Standard objects (Contact, Company, Deal, Ticket) are supported as source, intermediate, or target, and any portal custom object can fill any role too. The HubSpot marketplace listing is the next step. We're deciding pricing and listing timing alongside Carbon Copy.",
        }}
        notifyHeadline="Tell me when Traverse and Update is installable."
        notifyBody="One email when the marketplace listing goes live."
      />
    </>
  );
}
