import type { Metadata } from "next";
import { ProductPageShell } from "@/components/marketing/product-page-shell";
import { PRODUCT_META } from "@/lib/types";

export const metadata: Metadata = {
  title: "Debrief",
  description:
    "Debrief delivers AI-assisted call summaries inside HubSpot — structured, linked, and ready for the next step.",
};

export default function DebriefPage() {
  return (
    <ProductPageShell
      accent="brief"
      eyebrow="Debrief"
      name="Debrief"
      headline="AI-assisted call summaries, inside HubSpot."
      lede="Structured recaps for every meeting — linked to the right deal, the right contact, and the right next step. No copy-paste."
      marketplaceUrl={PRODUCT_META.debrief.marketplaceUrl}
      problem={{
        title: "The meeting ended. Now what?",
        body:
          "The richest context your team generates — conversation — evaporates. Notes end up in personal docs, in Slack, in heads. Deals lose shape between calls because the CRM never hears what actually happened.",
      }}
      features={[
        {
          title: "Auto-linked summaries",
          body: "Every meeting is stitched to the correct deal, contact, and company based on invitee + context.",
        },
        {
          title: "Structured recap",
          body: "Headlines, decisions, blockers, next steps, and open questions — not a wall of bullet points.",
        },
        {
          title: "Next-step capture",
          body: "Action items become tasks in HubSpot with owners and due dates, written back automatically.",
        },
        {
          title: "Sentiment + signal",
          body: "Detect stalling language, pricing pushback, and champion/detractor cues — right inside the deal.",
        },
        {
          title: "Team-wide search",
          body: "Ask ‘what did we tell Acme about renewals?’ and get the verbatim quote with a link to the call.",
        },
        {
          title: "Privacy-first",
          body: "Opt-in per meeting, per user. Transcripts stay in your region, redacted and access-controlled.",
        },
      ]}
      faq={[
        {
          q: "Which meeting providers are supported?",
          a: "Google Meet, Zoom, and Microsoft Teams via their native meeting APIs. No browser extension required.",
        },
        {
          q: "Where is transcript data stored?",
          a: "Your portal-level region. Transcripts are encrypted at rest and never used to train shared models.",
        },
        {
          q: "Can I disable Debrief per meeting?",
          a: "Yes — opt-in per user and per meeting, and bulk-disabled patterns (‘internal-only’, external vendors, etc).",
        },
        {
          q: "Does Debrief work on existing calls?",
          a: "Retroactive imports are supported for meetings with recordings on connected providers — up to 60 days back.",
        },
      ]}
    />
  );
}
