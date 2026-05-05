import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Container, Section } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  ...siteFreshness(),
  name: "About Dunamis Studios",
  description:
    "Dunamis Studios builds custom software and HubSpot extensions. Two practices, one engagement model: paid discovery, fixed quote, hosting on your infrastructure, full handover documentation.",
  url: `${SITE_URL}/about`,
  isPartOf: {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
  },
  publisher: {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
  },
};

export const metadata: Metadata = {
  title: "About",
  description:
    "Dunamis Studios builds custom software and HubSpot extensions. Two practices — Build Services for custom apps, HubSpot Custom Development for HubSpot-specific work — one engagement model.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · Dunamis Studios",
    description:
      "Dunamis Studios builds custom software and HubSpot extensions. Two practices — Build Services for custom apps, HubSpot Custom Development for HubSpot-specific work — one engagement model.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About · Dunamis Studios",
    description:
      "Dunamis Studios builds custom software and HubSpot extensions. Two practices — Build Services for custom apps, HubSpot Custom Development for HubSpot-specific work — one engagement model.",
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd id="jsonld-about-webpage" schema={webPageSchema} />

      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center stagger">
            <Badge className="mx-auto">About</Badge>
            <h1 className="mt-6 font-[var(--font-display)] text-4xl font-medium tracking-[-0.03em] leading-[1.05] text-[var(--fg)] sm:text-5xl lg:text-6xl">
              Two practices, one engagement model.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Dunamis Studios is a small, independent shop. We build custom
              software and HubSpot extensions. We start with paid discovery,
              ship to a fixed quote, deploy on your infrastructure, and hand
              over with full documentation.
            </p>
          </div>
        </Container>
      </div>

      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            What we do
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            Two service lines
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7">
              <Badge variant="build">Build Services</Badge>
              <h3 className="mt-4 font-[var(--font-display)] text-xl font-medium tracking-tight">
                Custom software outside HubSpot
              </h3>
              <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
                Internal tools, customer portals, dashboards, integrations
                between non-HubSpot systems, full custom applications. Direct
                engagements for businesses, white-label engagements for
                agencies.
              </p>
              <Link
                href="/build-services"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-build-700)] hover:text-[var(--color-build-800)] dark:text-[var(--color-build-400)] dark:hover:text-[var(--color-build-300)]"
              >
                Build Services
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7">
              <Badge variant="hubspot">HubSpot Custom Development</Badge>
              <h3 className="mt-4 font-[var(--font-display)] text-xl font-medium tracking-tight">
                HubSpot-specific work
              </h3>
              <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
                UI extensions, marketplace apps, HubSpot API integrations,
                custom workflow actions. We&apos;ve shipped multiple HubSpot
                marketplace listings and run our own portfolio of HubSpot
                products alongside client work.
              </p>
              <Link
                href="/custom-development"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-hubspot-700)] hover:text-[var(--color-hubspot-800)] dark:text-[var(--color-hubspot-400)] dark:hover:text-[var(--color-hubspot-300)]"
              >
                HubSpot Custom Development
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            How we work
          </div>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
            One engagement model
          </h2>
          <div className="mt-8 space-y-5 text-[var(--fg-muted)] leading-relaxed">
            <p>
              <strong className="text-[var(--fg)]">Paid discovery first.</strong>{" "}
              Every engagement starts with a written spec doc — feature list,
              tech stack, hosting plan, fixed-price quote. The discovery fee
              credits toward the build if you move forward; if you don&apos;t,
              you keep the spec.
            </p>
            <p>
              <strong className="text-[var(--fg)]">Fixed quote, fixed scope.</strong>{" "}
              We don&apos;t do open-ended hourly work. The quote in the spec
              doc is what you pay. Scope changes during the build trigger a
              new SOW; we don&apos;t lengthen invoices quietly.
            </p>
            <p>
              <strong className="text-[var(--fg)]">Your infrastructure.</strong>{" "}
              We deploy on accounts you own. You keep root access, billing,
              and DNS. Nothing is hostage on our side.
            </p>
            <p>
              <strong className="text-[var(--fg)]">Full handover.</strong>{" "}
              Architecture overview, environment variables, deploy steps,
              third-party accounts, runbook for the things that break first.
              Written for whoever owns the system after we hand over.
            </p>
            <p>
              <strong className="text-[var(--fg)]">30 days post-launch.</strong>{" "}
              Bug-fix support included for 30 days after launch. A bug means
              what we specced isn&apos;t working as specced. Anything outside
              the spec is a new engagement.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 sm:p-10 text-center">
            <h2 className="font-[var(--font-display)] text-3xl font-medium tracking-tight sm:text-4xl">
              Working on something?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--fg-muted)] leading-relaxed">
              Tell us what you&apos;re trying to ship. We&apos;ll respond
              within two business days with whether it&apos;s a fit.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/contact">
                  <Mail className="h-4 w-4" />
                  Get in touch
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
