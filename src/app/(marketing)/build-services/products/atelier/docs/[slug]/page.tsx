import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import {
  ATELIER_DOC_CATEGORY_LABEL,
  getAtelierDoc,
  loadAtelierDocs,
} from "@/lib/atelier-docs";
import { renderAtelierDocMarkdown } from "@/lib/atelier-docs-render";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";
const DOCS_BASE = "/build-services/products/atelier/docs";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const docs = await loadAtelierDocs();
  // Top-level docs only — nested API-reference subroutes are
  // pre-rendered by their own [...slug] route in a follow-on commit.
  return docs.filter((d) => !d.slug.includes("/")).map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getAtelierDoc(slug);
  if (!doc) {
    return {
      title: "Atelier docs",
      robots: { index: false, follow: false },
    };
  }
  const path = `${DOCS_BASE}/${slug}`;
  const title = `${doc.frontmatter.title} · Atelier docs`;
  return {
    title,
    description: doc.frontmatter.description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: doc.frontmatter.description,
      url: path,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: doc.frontmatter.description,
    },
  };
}

export default async function AtelierDocPage({ params }: RouteParams) {
  const { slug } = await params;
  const doc = await getAtelierDoc(slug);
  if (!doc) {
    notFound();
  }
  const html = await renderAtelierDocMarkdown(doc.body);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: doc.frontmatter.title,
    description: doc.frontmatter.description,
    datePublished: doc.frontmatter.updated,
    dateModified: doc.frontmatter.updated,
    url: `${SITE_URL}${DOCS_BASE}/${slug}`,
    author: { "@type": "Organization", name: "Dunamis Studios", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "Dunamis Studios",
      url: SITE_URL,
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
        item: `${SITE_URL}${DOCS_BASE}`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: doc.frontmatter.title,
        item: `${SITE_URL}${DOCS_BASE}/${slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd id={`jsonld-atelier-doc-${slug}`} schema={articleSchema} />
      <JsonLd id={`jsonld-atelier-doc-${slug}-breadcrumb`} schema={breadcrumbSchema} />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Marketplace", href: "/marketplace" },
          { label: "Atelier", href: "/marketplace/atelier" },
          { label: "Docs", href: DOCS_BASE },
          { label: doc.frontmatter.title },
        ]}
      />

      <article className="mt-6">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          {ATELIER_DOC_CATEGORY_LABEL[doc.frontmatter.category]}
        </div>
        <h1 className="mt-3 font-[var(--font-display)] text-4xl font-medium tracking-[-0.02em] text-[var(--fg)] sm:text-5xl">
          {doc.frontmatter.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--fg-muted)]">
          {doc.frontmatter.description}
        </p>
        <p className="mt-3 text-xs text-[var(--fg-subtle)]">
          Last updated: {doc.frontmatter.updated}
        </p>

        <div
          className="kb-prose mt-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </>
  );
}
