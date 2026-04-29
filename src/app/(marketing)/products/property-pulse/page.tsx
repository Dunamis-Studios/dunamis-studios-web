import type { Metadata } from "next";
import { ProductPageShell } from "@/components/marketing/product-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { PRODUCT_META } from "@/lib/types";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

// Single one-time install fee — mirrors the canonical pricing defined in
// src/app/(marketing)/pricing/page.tsx. Keep in lockstep if the price or
// model changes; the pricing page is the source of truth.
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
  offers: [
    {
      "@type": "Offer",
      name: "Property Pulse",
      price: "49",
      priceCurrency: "USD",
      category: "Installation",
      availability: "https://schema.org/InStock",
    },
  ],
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
      answerBlock="Property Pulse is a HubSpot marketplace app from Dunamis Studios that surfaces property change history directly on every CRM record. Admins choose which properties to track per object type, including custom objects, and users see the full change log, prior values, current values, and source in a single CRM card with inline editing and filtering."
      problem={{
        title: "CRM property changes are scattered across one-property-at-a-time history panels.",
        body:
          "HubSpot stores property history in a side panel scoped to a single property, opened by hovering one field at a time and clicking into its timeline. There is no native view that shows what changed across a record at once, or that filters that activity by source, user, value, or date range. By the time the missing context matters, finding the trail means clicking through every property's history individually.",
      }}
      pricingTeaser={{
        headline: "One price. Install once.",
        body: "$49, one-time. No tiers, no seats, no monthly bill.",
      }}
      screenshots={{
        eyebrow: "A look inside",
        headline: "The card, and what configures it.",
        items: [
          {
            src: "/images/property-pulse/crm_ui_card.png",
            alt: "Property Pulse card rendered on a HubSpot record, showing tracked properties and their change log.",
            width: 1479,
            height: 638,
            captionEyebrow: "On the record",
            caption:
              "Current value, recency, delta, and a filterable change log on every tracked property.",
          },
          {
            src: "/images/property-pulse/settings.png",
            alt: "Property Pulse settings page with Tracked Properties accordions per object type.",
            width: 2404,
            height: 1131,
            captionEyebrow: "In settings",
            caption:
              "Admins pick tracked properties per object type. Users can add their own on top, when admins allow it.",
          },
        ],
      }}
      features={[
        {
          title: "Per-object tracked-property configuration",
          body: "Admins choose which properties Property Pulse tracks on each object type. Coverage spans contacts, companies, deals, tickets, and every custom object in the portal. Users can add personal additions on top of the admin set when admins enable it.",
        },
        {
          title: "Current value with recency and delta",
          body: "Each tracked property displays its current value, a recency badge for how recently it changed, and a numeric delta when the property is numeric. The card surfaces what moved on the record without opening any side panel.",
        },
        {
          title: "Filterable change log with CSV export",
          body: "The card shows the recent change history for every tracked property at once, with filters for property, source, user, value, and date range. Filtered results export to CSV directly from the card.",
        },
        {
          title: "Inline property editing",
          body: "Property values can be edited directly from the card across enum, toggle, date, number, and text property types. The edit lands on the HubSpot record without opening the property editor or navigating away from the change log.",
        },
        {
          title: "Source attribution for every change",
          body: "Every entry in the change log identifies the source: a user, a workflow with a link to the flow, an import, the API, or a third-party integration. Owner IDs resolve to user names at render time so the log reads as people, not numeric IDs.",
        },
        {
          title: "Merge-aware history continuity",
          body: "When two HubSpot records are merged, Property Pulse pulls the change history from the merged-from record into the surviving record's card. The audit trail survives the merge.",
        },
      ]}
      comparison={{
        headline: "Property Pulse vs. HubSpot's native property history panel",
        themLabel: "HubSpot native panel",
        intro:
          "HubSpot ships a built-in property history side panel on every record. Property Pulse covers different ground. Here is how the two compare for teams that need an audit-friendly view of what changed, when, and why.",
        rows: [
          {
            dimension: "How you access changes",
            us: "A single CRM card on the record showing every tracked property's recent history at once.",
            them: "Hover one property at a time, click Details, open a side panel for that property only.",
          },
          {
            dimension: "Scope control",
            us: "Admins configure which properties matter per object type, including custom objects, so the change log stays signal-heavy.",
            them: "Every property is tracked individually on demand; no curated per-object view.",
          },
          {
            dimension: "Filtering across properties",
            us: "Filter the change log by property, source, user, and date range across all tracked properties on the record.",
            them: "Filtering exists within one property's history at a time.",
          },
          {
            dimension: "Inline editing",
            us: "Edit property values directly from the change log card.",
            them: "Read-only panel. Restore-from-source is the only write action.",
          },
          {
            dimension: "Custom object support",
            us: "Full support for custom objects with the same admin configuration.",
            them: "Supported, accessed the same way as standard objects.",
          },
        ],
      }}
      faq={[
        {
          q: "What is Property Pulse?",
          a: "Property Pulse is a HubSpot marketplace app from Dunamis Studios that adds a change-history CRM card to every record. The card shows the tracked properties for that object type, their current values with recency and delta, and a filterable log of who changed each one, when, from what value to what value, and through what source. Admins choose which properties to track per object type, including custom objects, and users can add their own additions on top when admins allow it.",
        },
        {
          q: "How is Property Pulse different from HubSpot's native property history panel?",
          a: "HubSpot's built-in property history is a side panel scoped to one property at a time, opened by hovering and clicking into that property. Property Pulse is a CRM card on the record itself that shows the recent change history for every tracked property at once, with filters that span all of those properties by property, source, user, value, and date range, plus CSV export and inline editing. The two surfaces solve different shapes of the same problem: HubSpot answers what changed on this one property, and Property Pulse answers what has been moving on this record overall.",
        },
        {
          q: "Which HubSpot objects does Property Pulse work with?",
          a: "Property Pulse supports contacts, companies, deals, tickets, and every custom object in your portal. Each object type has its own tracked-property configuration. The Property Pulse card is added to a record layout per object type in HubSpot record customization settings, so you choose which objects show the card and where it sits on the layout.",
        },
        {
          q: "How much does Property Pulse cost?",
          a: "Property Pulse is $49 as a one-time install fee per HubSpot portal. There are no tiers, no per-seat charges, and no monthly subscription. Once it is installed in a portal, every user in that portal can use it.",
        },
        {
          q: "Can Property Pulse track custom properties and custom objects?",
          a: "Yes. Property Pulse tracks any HubSpot property, including custom properties you have added, on any object type, including custom objects. Admins configure the tracked properties per object type in Property Pulse settings, and the card on each record surfaces only the properties configured for that object type.",
        },
        {
          q: "Who can see Property Pulse data inside HubSpot?",
          a: "Property Pulse renders as a CRM card inside HubSpot, so card visibility follows HubSpot's existing record permissions: any user who can view a record sees the Property Pulse card on that record. There is no separate Property Pulse role or per-user permission system. Configuring tracked properties happens in HubSpot Settings → Connected Apps → Property Pulse, which inherits HubSpot's own settings-area access controls.",
        },
        {
          q: "Does Property Pulse store any of our data outside HubSpot?",
          a: "Customer CRM data stays in HubSpot. The tracked-property configuration lives inside your own HubSpot portal in a HubDB table, not on Dunamis Studios servers. Property Pulse does not maintain a separate copy of your property values or change history; the change log is read from HubSpot's property-history API at card render time. Dunamis-side infrastructure holds OAuth tokens and app metadata only.",
        },
        {
          q: "How do we configure which properties Property Pulse tracks?",
          a: "Configuration lives inside HubSpot, in Settings → Connected Apps → Property Pulse. The page is titled Property Pulse · Tracked Properties and has one accordion per object type (Contacts, Companies, Deals, Tickets, plus any custom objects in your portal). Open the accordion for an object type and pick the properties Property Pulse should track for that type. Each accordion includes an Allow users to add their own properties toggle that lets individual users add personal additions on top of the admin set. A Week start day selector at the top tunes how the card's recency badges bucket recent activity.",
        },
      ]}
      />
    </>
  );
}
