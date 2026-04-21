import type { Metadata } from "next";
import { ProductPageShell } from "@/components/marketing/product-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { PRODUCT_META } from "@/lib/types";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

// Pricing isn't finalized yet, so the schema intentionally omits the
// offers[] array — adding placeholder numbers would poison AEO / LLM
// answers with wrong prices. Flip this on once /pricing publishes
// authoritative tiers.
const propertyPulseSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Property Pulse",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "CRM",
  operatingSystem: "Web-based",
  description:
    "Property Pulse adds a change-history card to every HubSpot record so you can see what changed, when, and who did it — without digging through audit logs.",
  url: `${SITE_URL}/products/property-pulse`,
  publisher: {
    "@type": "Organization",
    name: "Dunamis Studios",
    url: SITE_URL,
  },
};

export const metadata: Metadata = {
  title: "Property Pulse — See every change on every HubSpot record",
  description:
    "Property Pulse adds a change-history card to every HubSpot record so you can see what changed, when, and who did it — without digging through audit logs.",
  alternates: { canonical: "/products/property-pulse" },
  openGraph: {
    title:
      "Property Pulse — See every change on every HubSpot record",
    description:
      "Property Pulse adds a change-history card to every HubSpot record so you can see what changed, when, and who did it — without digging through audit logs.",
    url: "/products/property-pulse",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Property Pulse — See every change on every HubSpot record",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Property Pulse — Change history for HubSpot",
    description:
      "A change-history card on every HubSpot record. See what changed, when, and who did it.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Property Pulse — Change history for HubSpot",
      },
    ],
  },
};

export default function PropertyPulsePage() {
  return (
    <>
      <JsonLd id="jsonld-property-pulse" schema={propertyPulseSchema} />
      <ProductPageShell
      accent="pulse"
      eyebrow="Property Pulse"
      name="Property Pulse"
      headline="See every change on every record."
      lede="Property Pulse adds a change-history card to every HubSpot record so you can see what changed, when, and who did it — without digging through audit logs."
      marketplaceUrl={PRODUCT_META["property-pulse"].marketplaceUrl}
      problem={{
        title: "Your CRM data changes constantly. You can't see it.",
        body:
          "HubSpot tracks property history, but finding it means clicking into individual property timelines one at a time. When a deal amount shifts, a close date slips, or an owner changes, there's no single place to see it in context. By the time something matters, the trail is buried.",
      }}
      features={[
        {
          title: "Track what you care about",
          body: "Admins pick which properties to watch on each object type. Contacts, companies, deals, tickets, and any custom object. Users can add their own properties too, if admins allow it.",
        },
        {
          title: "Current value and recent history",
          body: "Each tracked property shows its current value, a recency badge, and a numeric delta when relevant. One glance tells you what moved.",
        },
        {
          title: "Filterable change log",
          body: "Click any property to see the full history. Filter by date range, source, user, or value. Export to CSV.",
        },
        {
          title: "Inline editing",
          body: "Edit property values directly from the card. Enums, toggles, dates, numbers, text. No jumping to the property editor.",
        },
        {
          title: "Source attribution",
          body: "Every change shows where it came from: a user, a workflow (with a link to the flow), an import, the API, or a third-party integration. Owner IDs resolve to names automatically.",
        },
        {
          title: "Merge-aware",
          body: "When records get merged, Property Pulse surfaces the history from the merged-from record so you don't lose the trail.",
        },
      ]}
      faq={[
        {
          q: "Which objects does it work on?",
          a: "Contacts, companies, deals, tickets, and any custom object in your portal.",
        },
        {
          q: "What permissions does it need?",
          a: "Read and write on the CRM objects you want to track, plus HubDB (for storing your configuration inside your own portal) and automation (to resolve workflow names in the change log).",
        },
        {
          q: "Does it slow down HubSpot?",
          a: "No. Property Pulse fetches data when the card loads, not continuously. All requests go through retry logic so HubSpot rate limits never break the experience.",
        },
        {
          q: "Where is my configuration stored?",
          a: "Inside your own HubSpot portal, in a HubDB table. We don't store your CRM data on our servers.",
        },
        {
          q: "Can users customize what they see?",
          a: "If admins enable it, each user can add their own properties to watch on top of the admin-tracked set. Their additions are private to them.",
        },
      ]}
      />
    </>
  );
}
