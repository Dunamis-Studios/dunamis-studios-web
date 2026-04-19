import type { Metadata } from "next";
import { ProductPageShell } from "@/components/marketing/product-page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { PRODUCT_META } from "@/lib/types";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const debriefSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Debrief",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "CRM",
  operatingSystem: "Web-based",
  description:
    "Handoff intelligence for HubSpot CRM. Generates structured briefs and conversational handoff messages when a CRM record changes ownership.",
  url: `${SITE_URL}/products/debrief`,
  publisher: {
    "@type": "Organization",
    name: "Dunamis Studios",
    url: SITE_URL,
  },
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "19",
      priceCurrency: "USD",
      category: "Subscription",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "49",
      priceCurrency: "USD",
      category: "Subscription",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      price: "149",
      priceCurrency: "USD",
      category: "Subscription",
      availability: "https://schema.org/InStock",
    },
  ],
};

export const metadata: Metadata = {
  title: "Debrief — AI handoff briefs for HubSpot CRM ownership changes",
  description:
    "Generate structured briefs and conversational handoff messages the moment a CRM record changes ownership. Built for HubSpot Sales and Service teams.",
  alternates: { canonical: "/products/debrief" },
  openGraph: {
    title: "Debrief — AI handoff briefs for HubSpot CRM ownership changes",
    description:
      "Generate structured briefs and conversational handoff messages the moment a CRM record changes ownership. Built for HubSpot Sales and Service teams.",
    url: "/products/debrief",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Debrief — Handoff intelligence for HubSpot CRM",
    description:
      "Structured briefs and drafted handoff messages for every CRM ownership change.",
  },
};

export default function DebriefPage() {
  return (
    <>
      <JsonLd id="jsonld-debrief" schema={debriefSchema} />
      <ProductPageShell
      accent="brief"
      eyebrow="Debrief"
      name="Debrief"
      headline="Handoff intelligence for HubSpot CRM."
      lede="When a record changes hands, Debrief produces a structured brief for the new owner and drafts the conversational message the old one sends. No knowledge loss, no awkward start."
      marketplaceUrl={PRODUCT_META.debrief.marketplaceUrl}
      problem={{
        title: "Handoffs are where knowledge goes to die.",
        body:
          "When a deal, contact, company, ticket, or custom object switches owners in HubSpot, everything the outgoing rep knew — why the customer bought, who the real champion is, what was promised, what's at risk — lives in their head or scattered notes. The new owner inherits the record, not the context. Debrief fixes the handoff layer.",
      }}
      features={[
        {
          title: "Structured brief, drafted message",
          body:
            "Two-stage AI pipeline on every handoff: a structured brief (Why / People / Timeline / Next Steps / Risk Flags / Promises) followed by a conversational message tuned to the handoff type — BDR→AE, AE→CS, CS→CS, rep→rep, or marketing→sales.",
        },
        {
          title: "Every CRM object",
          body:
            "Attaches as a CRM card on contacts, companies, deals, tickets, and every custom object in your portal. Install once; every record has a handoff surface.",
        },
        {
          title: "Brief me, or Handoff",
          body:
            "Preview a brief for yourself before a call — no ownership change. Or execute an atomic Handoff that reassigns the record, attaches the brief as a Note, and logs the event.",
        },
        {
          title: "Pre-flight data-gap scanner",
          body:
            "Before it generates, Debrief scans the record for missing owner, low engagement, staleness, and sender-notes gaps — so no brief ships on bad data.",
        },
        {
          title: "Handoff Log and Briefs for me",
          body:
            "Every handoff logged with who→who, when, and why. Each rep gets a ‘Briefs for me’ inbox of incoming handoffs, filtered by role and record type.",
        },
        {
          title: "Admin-tunable depth",
          body:
            "Per-object-type controls for which associations to include, how many records per type, whether to fan out to engagements, and configurable section labels. Dry-run enforcement mode for safe rollout.",
        },
      ]}
      faq={[
        {
          q: "Which HubSpot objects does it work on?",
          a: "Contacts, companies, deals, tickets, and every custom object in your portal. Debrief attaches as a CRM card on every record surface.",
        },
        {
          q: "How does the credit system work?",
          a: "Each brief costs one to three credits depending on depth — custom objects and engagement fan-out raise the cost. Your portal has a monthly allotment from your plan (50 / 250 / 1,000 for Starter / Pro / Enterprise, 2x in the first month). Credit packs stack in an addon bucket that never expires.",
        },
        {
          q: "Can I customize what the brief says?",
          a: "Yes. Admins can rename the six sections to match your team's vocabulary, tune which associations and properties to pull per object type, and add per-handoff-type AI instructions plus message-template guidance. Enterprise adds portal-level custom prompt tuning.",
        },
        {
          q: "What's the difference between Brief me and Handoff?",
          a: "Brief me is a preview — it generates a brief for you without changing ownership, useful before a call or internal review. Handoff is the atomic operation: it reassigns ownership to the recipient, attaches the brief as a Note on the record, and writes the event to the Handoff Log.",
        },
        {
          q: "Does it work for team-wide handoffs?",
          a: "Today, a Debrief handoff is a single-user transfer — outgoing owner to incoming owner, with the log visible to both. Multi-user team sharing and role permissions are on the roadmap, not shipped yet.",
        },
        {
          q: "What permissions does Debrief need?",
          a: "Read on the record plus its associated contacts, companies, deals, tickets, custom objects, and recent engagements. Write permission only for the atomic Handoff flow — to reassign owner and attach the brief Note.",
        },
      ]}
      />
    </>
  );
}
