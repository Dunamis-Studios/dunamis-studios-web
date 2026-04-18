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
    "Property history tracking for HubSpot. See exactly when and how any tracked property changed on any HubSpot record — audit trail and history visualization for HubSpot admins.",
  url: `${SITE_URL}/products/property-pulse`,
  publisher: {
    "@type": "Organization",
    name: "Dunamis Studios",
    url: SITE_URL,
  },
};

export const metadata: Metadata = {
  title: "Property Pulse — Track property history on any HubSpot object",
  description:
    "See exactly when and how any tracked property changed on any HubSpot record. Audit trail and history visualization for HubSpot admins.",
  alternates: { canonical: "/products/property-pulse" },
  openGraph: {
    title:
      "Property Pulse — Track property history on any HubSpot object",
    description:
      "See exactly when and how any tracked property changed on any HubSpot record. Audit trail and history visualization for HubSpot admins.",
    url: "/products/property-pulse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Property Pulse — Property history for HubSpot",
    description:
      "Audit trail and history visualization for any tracked property on any HubSpot object.",
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
      headline="Real-time deal health for HubSpot CRM."
      lede="Watch every property that matters across every deal — and get a signal the moment things go off-trend."
      marketplaceUrl={PRODUCT_META["property-pulse"].marketplaceUrl}
      problem={{
        title: "You can't forecast what you can't see.",
        body:
          "HubSpot reports tell you where deals are — not whether the underlying data still reflects reality. Stale amounts, missing close dates, untouched next steps: they rot quietly and ambush you on Friday.",
      }}
      features={[
        {
          title: "Drift detection",
          body: "Define what ‘healthy’ looks like per pipeline. We flag every deal that wandered outside the lines.",
        },
        {
          title: "Staleness alerts",
          body: "Configurable timers per stage. A deal idle too long surfaces with full context, not a digest.",
        },
        {
          title: "Risk scoring",
          body: "Composite health score per deal, per rep, per pipeline — tuned by you, explained on hover.",
        },
        {
          title: "Inline remediation",
          body: "Update fields from the Pulse view. No context-switch, no deep-link trips.",
        },
        {
          title: "Daily rollups",
          body: "Opinionated morning email: what changed, what's at risk, what needs a human today.",
        },
        {
          title: "Audit trail",
          body: "Every Pulse action is logged with who, what, when. Managers see the work, not just the outcome.",
        },
      ]}
      faq={[
        {
          q: "Will this slow down my HubSpot?",
          a: "No. Pulse polls incrementally and batches writes. We never touch the UI thread of your HubSpot portal.",
        },
        {
          q: "Which plan pipelines are supported?",
          a: "Any custom pipeline. Pulse reads your schema at install time and adapts — no hardcoded field assumptions.",
        },
        {
          q: "What permissions do you need?",
          a: "Read on deals, companies, contacts, owners, and pipeline metadata. Write only on fields you explicitly enable.",
        },
        {
          q: "How does Pulse handle custom properties?",
          a: "First-class. Every custom property on the deal object is selectable for health rules — strings, numbers, dates, enumerations.",
        },
      ]}
      />
    </>
  );
}
