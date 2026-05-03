import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { CustomObjectDecisionTree } from "@/components/marketing/custom-object-decision-tree";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { buildFaqPageSchema } from "@/components/marketing/article-extras";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the decision tree recommend?",
    a: "One of five HubSpot data structures: Custom Object, Custom Property, Repurposed Standard Object, HubDB, or Custom Event. Each recommendation comes with the tradeoffs (what you gain, what you give up), worked examples from common HubSpot use cases, and tier eligibility (Custom Objects require Enterprise on the affected hub; HubDB requires CMS Hub Pro or Enterprise; Custom Events have their own tier requirements).",
  },
  {
    q: "What questions does the tree ask?",
    a: "Up to seven, branching based on your answers. Core dimensions are: how the data relates to a parent record (one-to-one, one-to-many, many-to-many), how often it changes, whether it has its own lifecycle independent of the parent, whether you need to report on it across instances, whether you need it on workflow enrollments, and whether the volume justifies a separate object. The tree stops asking once it has enough information to make a confident recommendation.",
  },
  {
    q: "Where does the tier eligibility data come from?",
    a: "HubSpot's public product KB for the platform-level limits (Custom Objects on Enterprise, HubDB on CMS Hub Pro and Enterprise, Custom Events on Enterprise plus the Marketing Hub Enterprise platform fee). For the structural and reporting tradeoffs, we cite Hyphadev, Set2Close, ProfitPad, and RevBlack alongside the HubSpot KB, so you can read the underlying source for the recommendation rather than just trust the output.",
  },
  {
    q: "What if my use case looks like more than one option?",
    a: "Common. The tree resolves ambiguity by asking the disambiguating question rather than picking a default. For example, a use case that could fit either Custom Object or Repurposed Standard Object is split by whether you need the data on workflow enrollments and whether the standard object you would repurpose has rules that conflict with your data. The output names both options when the tradeoffs are close, so you can decide based on your team's tier and reporting needs.",
  },
];

const faqPageSchema = buildFaqPageSchema(FAQ, {
  name: "HubSpot Custom Object Decision Tree FAQ",
  description:
    "Frequently asked questions about the Dunamis Studios HubSpot Custom Object Decision Tree: recommendations, branching logic, and tier eligibility sources.",
  url: `${SITE_URL}/tools/custom-object-decision-tree`,
});

const TITLE = "HubSpot Custom Object Decision Tree";
const DESCRIPTION =
  "A branching seven-question decision tree that recommends Custom Object, Custom Property, Repurposed Standard Object, HubDB, or Custom Event based on how your data relates to its parent record, how often it changes, and whether you need real reporting on it. Tier eligibility and structural tests cite HubSpot's product KB, Hyphadev, Set2Close, ProfitPad, and RevBlack.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tools/custom-object-decision-tree" },
  openGraph: {
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    url: "/tools/custom-object-decision-tree",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${TITLE} · Dunamis Studios`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · Dunamis Studios`,
    description: DESCRIPTION,
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: `${TITLE} · Dunamis Studios`,
      },
    ],
  },
};

function buildSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    ...siteFreshness(),
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/tools/custom-object-decision-tree`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

export default function CustomObjectDecisionTreePage() {
  return (
    <>
      <JsonLd id="jsonld-custom-object-decision-tree" schema={buildSchema()} />
      <JsonLd id="jsonld-custom-object-decision-tree-faq" schema={faqPageSchema} />
      <Section>
        <Container size="lg">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All free tools
          </Link>

          <div className="mt-8 max-w-3xl">
            <Badge variant="accent">Free tool</Badge>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl font-medium tracking-[-0.02em] leading-[1.05] text-[var(--fg)] sm:text-5xl">
              Custom Object, Custom Property, or something else?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--fg-muted)]">
              A branching decision tree that asks up to seven questions about
              how the data relates to its parent record, how often it changes,
              and whether you need cross-instance reporting. The tree returns
              one of five recommendations with the tradeoffs, examples, and
              tier eligibility you need before building.
            </p>
          </div>

          <div className="mt-12">
            <CustomObjectDecisionTree />
          </div>
        </Container>
      </Section>

      <MarketingFaq faq={FAQ} />
    </>
  );
}
