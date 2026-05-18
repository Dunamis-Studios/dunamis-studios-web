import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { siteFreshness } from "@/lib/schema-freshness";
import { getAtelierDocsNavigation } from "@/lib/atelier-docs";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";
const PAGE_PATH = "/build-services/products/atelier/docs";

export const metadata: Metadata = {
  title: "Atelier documentation",
  description:
    "Install, configure, and use Atelier — the perpetual-license desktop wedding planner workspace from Dunamis Studios. Setup, user guide, API reference, troubleshooting, and policies.",
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: "Atelier documentation · Dunamis Studios",
    description:
      "Install, configure, and use Atelier. Setup, user guide, API reference, troubleshooting, and policies.",
    url: PAGE_PATH,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atelier documentation · Dunamis Studios",
    description:
      "Install, configure, and use Atelier. Setup, user guide, API reference, troubleshooting, and policies.",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "Marketplace",
      item: `${SITE_URL}/marketplace`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Atelier",
      item: `${SITE_URL}/marketplace/atelier`,
    },
    {
      "@type": "ListItem",
      position: 4,
      name: "Documentation",
      item: `${SITE_URL}${PAGE_PATH}`,
    },
  ],
};

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  ...siteFreshness(),
  headline: "Atelier documentation",
  description:
    "Setup, user guide, API reference, troubleshooting, and policies for Atelier — the perpetual-license desktop wedding planner workspace.",
  url: `${SITE_URL}${PAGE_PATH}`,
  author: { "@type": "Organization", name: "Dunamis Studios", url: SITE_URL },
  publisher: { "@type": "Organization", name: "Dunamis Studios", url: SITE_URL },
};

export default async function AtelierDocsIndexPage() {
  const groups = await getAtelierDocsNavigation();

  return (
    <>
      <JsonLd id="jsonld-atelier-docs" schema={collectionSchema} />
      <JsonLd id="jsonld-atelier-docs-breadcrumb" schema={breadcrumbSchema} />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Atelier", href: "/marketplace/atelier" },
          { label: "Documentation" },
        ]}
      />

      <div className="mt-6">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Atelier · Documentation
        </div>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-[-0.03em] text-[var(--fg)] sm:text-5xl">
          Everything you need to run Atelier.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--fg-muted)]">
          Atelier is desktop software for professional wedding planners.
          Install it on Windows, run it locally, and own your data.
          Below is the complete reference — setup, daily use, API, and
          policies.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)] p-8 text-center">
          <p className="text-[var(--fg-muted)]">
            Documentation is being written. Check back shortly.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {groups.map((group) => (
            <div
              key={group.category}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
            >
              <h2 className="font-[var(--font-display)] text-xl font-medium tracking-tight">
                {group.label}
              </h2>
              <ul className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-atelier-700)] hover:text-[var(--color-atelier-600)] dark:text-[var(--color-atelier-300)] dark:hover:text-[var(--color-atelier-400)]"
                    >
                      {item.title}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
