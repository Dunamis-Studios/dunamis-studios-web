import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductPageShell } from "@/components/marketing/product-page-shell";
import { Container } from "@/components/ui/primitives";
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
    "Debrief is a HubSpot marketplace app from Dunamis Studios that generates structured handoff briefs and conversational handoff messages whenever ownership of a CRM record changes. It reads the record's history, properties, and engagement to produce a concise brief for the new owner and a personalized message they can send to the contact, so handoffs preserve context instead of restarting it.",
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

// Single source of truth for the buyer-intent FAQ. Used twice on the
// page: rendered as <details> accordions inside ProductPageShell, and
// emitted as schema.org FAQPage JSON-LD for AEO extraction (so answer
// engines can cite individual Q/A pairs verbatim). Edits here flow to
// both surfaces; do not maintain a parallel list.
const FAQ: { q: string; a: string }[] = [
  {
    q: "What is Debrief?",
    a: "Debrief is a HubSpot marketplace app from Dunamis Studios that generates structured handoff briefs and conversational handoff messages whenever ownership of a CRM record changes. It reads the record's properties, history, associations, and engagement to produce a concise brief for the new owner and a personalized message the previous owner can send to the contact. The goal is to preserve context across handoffs instead of restarting it from scratch.",
  },
  {
    q: "How is Debrief different from AI meeting summary tools?",
    a: "AI meeting summary tools (Otter, Fireflies, Gong, Fathom, and similar) turn a single recorded conversation into notes, action items, and sometimes a follow-up email. Debrief is triggered differently: a HubSpot user initiates a handoff from the Debrief CRM card on a record. It reads the entire record (properties, change history, associations, engagement timeline) rather than one meeting, and produces a brief for the incoming owner plus a draft message the outgoing owner can send to the contact. The two solve adjacent but different problems.",
  },
  {
    q: "When does Debrief generate a handoff?",
    a: "Debrief runs on demand, when a HubSpot user initiates one from the Debrief CRM card on a record. The Handoff operation is the atomic action: it reassigns ownership to the recipient, attaches the generated brief as a Note, and writes the event to the Handoff Log. Debrief also offers a Draft Brief mode that produces a brief without changing ownership, useful for call prep or internal review.",
  },
  {
    q: "What's in a Debrief handoff brief?",
    a: "Each brief is structured into six sections by default: Why (the strategic why behind the relationship), People (the contacts and stakeholders), Timeline (the relevant chronology), Next Steps (what the new owner should do first), Risk Flags (where the relationship is fragile), and Promises (commitments the previous owner made). Admins can rename the six section labels to match team vocabulary. Alongside the brief, Debrief drafts a conversational message tuned to the handoff type (for example, BDR to AE, AE to CS, or CS to CS).",
  },
  {
    q: "How much does Debrief cost?",
    a: "Debrief is a subscription billed per HubSpot portal per month, with three tiers: Starter at $19, Pro at $49, and Enterprise at $149. Each tier includes a monthly credit allotment (50, 250, and 1,000 respectively, doubled in the first month). Each brief consumes one to three credits depending on depth. Credit packs can be purchased on top of the subscription and stack in an addon bucket that does not expire.",
  },
  {
    q: "Which HubSpot objects does Debrief work with?",
    a: "Debrief renders as a CRM card on contacts, companies, deals, tickets, and every custom object in the portal. Each object type can be configured separately for which associations Debrief reads, how many records per association, whether to fan out to engagements, and how brief sections are labeled. Once Debrief is installed, every record across these object types has a handoff surface.",
  },
  {
    q: "Does Debrief use AI, and where does the data go?",
    a: "Debrief uses a large language model to generate the brief and the message; today the LLM provider is Anthropic, via the Claude API. Customer CRM data is read from HubSpot at handoff time, scoped to only the record context Debrief needs (properties, change history, associations, engagement timeline configured by admins), and sent to the LLM provider for generation. The resulting brief is written back to HubSpot as a Note on the record. Per our LLM provider agreement, your portal's data is not used to train the model. Dunamis Studios servers do not maintain a separate copy of customer CRM data.",
  },
  {
    q: "Can we customize the brief and message Debrief generates?",
    a: "Yes. Admins can rename the six brief section labels to match team vocabulary (Why, People, Timeline, Next Steps, Risk Flags, Promises by default). Per-object-type, admins control which associations Debrief reads, how many records per association, and whether to fan out to engagements. Per-handoff-type, admins can add AI instructions and message-template guidance so a BDR-to-AE brief reads differently from a CS-to-CS brief. The Enterprise tier adds portal-level custom prompt tuning.",
  },
];

// FAQPage schema sourced from the FAQ constant above. Sits next to the
// SoftwareApplication schema because the two cover different intents:
// SoftwareApplication establishes the entity (name, category, pricing
// tiers); FAQPage exposes per-question answers that ChatGPT,
// Perplexity, Claude, and Google AI Overviews can lift directly into
// citations.
const faqPageSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: {
      "@type": "Answer",
      text: a,
    },
  })),
};

export const metadata: Metadata = {
  title: "Debrief: AI-powered CRM handoffs for HubSpot",
  description:
    "Debrief is a HubSpot marketplace app that generates structured handoff briefs and draft messages when a CRM record changes ownership. Not a meeting tool.",
  alternates: { canonical: "/products/debrief" },
  openGraph: {
    title: "Debrief: AI-powered CRM handoffs for HubSpot",
    description:
      "Debrief is a HubSpot marketplace app that generates structured handoff briefs and draft messages when a CRM record changes ownership. Not a meeting tool.",
    url: "/products/debrief",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Debrief: AI-powered CRM handoffs for HubSpot",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Debrief: AI-powered CRM handoffs for HubSpot",
    description:
      "Debrief is a HubSpot marketplace app that generates structured handoff briefs and draft messages when a CRM record changes ownership. Not a meeting tool.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "Debrief: AI-powered CRM handoffs for HubSpot",
      },
    ],
  },
};

export default function DebriefPage() {
  return (
    <>
      {/*
        Two JSON-LD blocks side by side: the SoftwareApplication block
        carries entity + offer signals (what the app is, who publishes
        it, what the tiers cost); the FAQPage block carries per-question
        answers for AEO extraction. They serve complementary intents
        and are both needed for full search-engine and answer-engine
        coverage.
      */}
      <JsonLd id="jsonld-debrief" schema={debriefSchema} />
      <JsonLd id="jsonld-debrief-faq" schema={faqPageSchema} />
      <ProductPageShell
      accent="brief"
      eyebrow="Debrief"
      name="Debrief"
      headline="Handoff intelligence for HubSpot CRM."
      lede="When a HubSpot user initiates a handoff from the Debrief CRM card, Debrief generates a structured brief for the incoming owner and drafts the message the outgoing owner sends to the contact."
      marketplaceUrl={PRODUCT_META.debrief.marketplaceUrl}
      installCtaLabel="Coming Soon"
      answerBlock="Debrief is a HubSpot marketplace app from Dunamis Studios that generates structured handoff briefs and conversational handoff messages whenever ownership of a CRM record changes. It reads the record's history, properties, and engagement to produce a concise brief for the new owner and a personalized message they can send to the contact, so handoffs preserve context instead of restarting it."
      problem={{
        title: "Handoffs are where CRM context goes to die.",
        body:
          "When a HubSpot record changes hands, the outgoing owner's mental model goes with them: why the customer bought, who the real champion is, what was promised, and what is at risk. Most teams paper this over with a manual handoff note that nobody reads, or skip it entirely and hope the new owner figures it out from the record itself. The result is a quiet, recurring loss of context that shows up as missed renewals, slow ramps, and rework with the customer.",
      }}
      features={[
        {
          title: "Two-stage brief and message generation",
          body:
            "Each handoff produces two artifacts. A structured brief for the new owner with sections for Why, People, Timeline, Next Steps, Risk Flags, and Promises, followed by a conversational message tuned to the handoff type (BDR to AE, AE to CS, CS to CS, rep to rep, or marketing to sales).",
        },
        {
          title: "Coverage on every CRM object type",
          body:
            "Debrief renders as a CRM card on contacts, companies, deals, tickets, and every custom object in the portal. One install puts a handoff surface on every record.",
        },
        {
          title: "Draft Brief preview vs. atomic Handoff",
          body:
            "Draft Brief generates a brief for the current owner without changing ownership, useful for prep before a call or internal review. Handoff is the atomic operation: it reassigns ownership to the recipient, attaches the brief as a Note on the record, and writes the event to the Handoff Log.",
        },
        {
          title: "Pre-flight data-gap scanner",
          body:
            "Before generation, Debrief scans the record for missing owner, low engagement signal, record staleness, and missing sender notes. Briefs are held back when the inputs are too thin to produce a useful one.",
        },
        {
          title: "Handoff Log and per-rep brief inbox",
          body:
            "Every Debrief handoff is logged with the previous owner, the new owner, the timestamp, and the reason. Each rep has a Briefs for me inbox of incoming handoffs, filterable by role and record type.",
        },
        {
          title: "Admin-tunable depth and rollout controls",
          body:
            "Per-object-type controls govern which associations to include, how many records per association, whether to fan out to engagements, and how the brief sections are labeled. A dry-run enforcement mode lets admins stage rollout safely without changing record ownership.",
        },
      ]}
      comparison={{
        headline: "Debrief vs. AI meeting summary tools",
        themLabel: "Meeting summary tools",
        intro:
          "Debrief is often grouped with meeting summary tools because both involve AI and CRM. The two solve different problems. Meeting summary tools turn one conversation into notes. Debrief turns a record's entire history into a handoff that the next owner can act on.",
        rows: [
          {
            dimension: "What triggers it",
            us: "A user clicking Handoff or Draft Brief on the Debrief CRM card on a HubSpot record.",
            them: "A meeting ending on Zoom, Google Meet, Teams, or a similar platform.",
          },
          {
            dimension: "Input it reads",
            us: "The full record: properties, change history, associations, engagement timeline, prior owner notes.",
            them: "Audio or transcript of a single meeting.",
          },
          {
            dimension: "What it produces",
            us: "A structured brief for the new owner and a conversational message they can send to the contact.",
            them: "A summary, action items, and sometimes a draft follow-up email tied to the meeting.",
          },
          {
            dimension: "When it runs",
            us: "On demand, when the outgoing owner is preparing to hand off the record. Generation is user-initiated, not automatic on every owner change.",
            them: "After every meeting, regardless of whether handoff is involved.",
          },
          {
            dimension: "Where it lives",
            us: "Inside the HubSpot record. The brief and message are surfaced where handoffs actually happen.",
            them: "Inside the meeting platform's interface or a separate notes app, often disconnected from the CRM.",
          },
        ],
      }}
      faq={FAQ}
      />
      <div className="border-t border-[var(--border)] bg-[var(--bg-subtle)]">
        <Container size="md" className="py-8 text-center">
          <p className="text-sm text-[var(--fg-muted)]">
            See what&apos;s shipped, what&apos;s in progress, and what&apos;s
            next.
          </p>
          <Link
            href="/products/debrief/roadmap"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brief-500)] hover:underline"
          >
            Debrief roadmap
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Container>
      </div>
    </>
  );
}
