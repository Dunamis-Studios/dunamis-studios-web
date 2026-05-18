/**
 * Atelier docs search at
 * /build-services/products/atelier/docs/search. Mounts the
 * client-side fuzzy search component (Fuse.js over the
 * /atelier-docs-index.json index file built at next build time).
 * Metadata is robots:noindex because search-result URLs are
 * dynamic and the canonical entry points are the docs themselves.
 */
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AtelierDocsSearch } from "@/components/marketing/atelier-docs-search";

const PAGE_PATH = "/build-services/products/atelier/docs/search";

export const metadata: Metadata = {
  title: "Search Atelier docs",
  description:
    "Search across the entire Atelier documentation hub — install, user guide, API reference, troubleshooting, and policies.",
  alternates: { canonical: PAGE_PATH },
  // Search pages should not be indexed — query results are dynamic
  // and the canonical entry points are the underlying docs.
  robots: { index: false, follow: true },
};

export default function AtelierDocsSearchPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Atelier", href: "/marketplace/atelier" },
          {
            label: "Docs",
            href: "/build-services/products/atelier/docs",
          },
          { label: "Search" },
        ]}
      />

      <div className="mt-6">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Atelier · Documentation
        </div>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-[-0.03em] text-[var(--fg)] sm:text-5xl">
          Search the docs.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--fg-muted)]">
          Fuzzy search across every Atelier doc. The index is built at
          deploy time and runs entirely in your browser — no query is
          sent to a server.
        </p>
      </div>

      <div className="mt-10">
        <AtelierDocsSearch />
      </div>
    </>
  );
}
