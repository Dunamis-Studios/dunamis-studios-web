/**
 * Contact page at /contact. Studio-level inquiry surface that funnels
 * any kind of conversation (Build Services scoping, HubSpot Custom
 * Development, general questions). Mounts the
 * CustomDevelopmentContactForm with source="general" so HubSpot can
 * segment these leads from lane-specific submissions.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { HeroGradient } from "@/components/marketing/hero-gradient";
import { CustomDevelopmentContactForm } from "@/components/marketing/custom-development-contact-form";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  ...siteFreshness(),
  name: "Contact Dunamis Studios",
  description:
    "Get in touch with Dunamis Studios. Tell us what you're trying to ship and we'll respond within two business days.",
  url: `${SITE_URL}/contact`,
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
  title: "Contact",
  description:
    "Get in touch with Dunamis Studios. Tell us what you're trying to ship and we'll respond within two business days.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact · Dunamis Studios",
    description:
      "Get in touch with Dunamis Studios. Tell us what you're trying to ship and we'll respond within two business days.",
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact · Dunamis Studios",
    description:
      "Get in touch with Dunamis Studios. Tell us what you're trying to ship and we'll respond within two business days.",
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd id="jsonld-contact-webpage" schema={webPageSchema} />

      <div className="relative overflow-hidden">
        <HeroGradient />
        <Container size="xl" className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center stagger">
            <Badge className="mx-auto">Contact</Badge>
            <h1 className="mt-6 font-[var(--font-display)] text-4xl font-medium tracking-[-0.03em] leading-[1.05] text-[var(--fg)] sm:text-5xl lg:text-6xl">
              Tell us what you&apos;re shipping.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Custom software, HubSpot work, white-label engagements,
              partnerships, or just a question. We respond within two business
              days.
            </p>
          </div>
        </Container>
      </div>

      <Section className="border-t border-[var(--border)]">
        <Container size="md">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-1">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  Service lines
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link
                      href="/build-services"
                      className="text-[var(--color-build-700)] hover:text-[var(--color-build-800)] dark:text-[var(--color-build-400)] dark:hover:text-[var(--color-build-300)]"
                    >
                      Build Services
                    </Link>
                    <p className="mt-1 text-[var(--fg-muted)]">
                      Custom software outside HubSpot.
                    </p>
                  </li>
                  <li className="pt-1">
                    <Link
                      href="/custom-development"
                      className="text-[var(--color-hubspot-700)] hover:text-[var(--color-hubspot-800)] dark:text-[var(--color-hubspot-400)] dark:hover:text-[var(--color-hubspot-300)]"
                    >
                      HubSpot Custom Development
                    </Link>
                    <p className="mt-1 text-[var(--fg-muted)]">
                      HubSpot-specific work.
                    </p>
                  </li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  Help
                </div>
                <p className="mt-3 text-sm text-[var(--fg-muted)] leading-relaxed">
                  Account, billing, or product questions usually have an
                  answer in the{" "}
                  <Link
                    href="/help"
                    className="text-[var(--accent)] hover:underline underline-offset-4"
                  >
                    Help Center
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7 sm:p-9">
                <CustomDevelopmentContactForm
                  source="general"
                  heading="Get in touch"
                  blurb="Tell us what you're working on. We'll respond within two business days."
                  successHeading="Thanks, message received."
                  successBody="We'll respond within two business days."
                  submitLabel="Send message"
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
