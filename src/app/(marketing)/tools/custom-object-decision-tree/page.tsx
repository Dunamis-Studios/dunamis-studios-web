import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { CustomObjectDecisionTree } from "@/components/marketing/custom-object-decision-tree";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

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
    </>
  );
}
