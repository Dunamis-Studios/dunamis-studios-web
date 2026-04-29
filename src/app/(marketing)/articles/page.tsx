import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { listPosts, type Post } from "@/lib/content";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

const PAGE_DESCRIPTION =
  "News, updates, and insights from the Dunamis Studios team.";

export const metadata: Metadata = {
  title: "Articles",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/articles" },
};

/**
 * Build Blog schema for the articles index. Includes the 10 most
 * recent published posts as nested BlogPosting items so answer
 * engines can pick up the index as a list of citable surfaces in a
 * single fetch. The publisher field cross-references the global
 * Organization schema by @id rather than redefining it.
 */
function buildBlogSchema(posts: Post[]) {
  const recent = posts.slice(0, 10);
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Dunamis Studios articles",
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/articles`,
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
    },
    blogPost: recent.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: `${SITE_URL}/articles/${p.slug}`,
      datePublished: p.publishedAt
        ? new Date(p.publishedAt).toISOString()
        : new Date(p.updatedAt).toISOString(),
      dateModified: new Date(p.updatedAt).toISOString(),
    })),
  };
}

export default async function ArticlesPage() {
  const posts = await listPosts("article", { includeDrafts: false });
  const blogSchema = buildBlogSchema(posts);

  return (
    <Section>
      <Container>
        {posts.length > 0 ? (
          <JsonLd id="jsonld-articles-index" schema={blogSchema} />
        ) : null}
        <PageHeader
          title="Articles"
          description={PAGE_DESCRIPTION}
        />

        {posts.length === 0 ? (
          <p className="mt-12 text-[var(--fg-muted)]">
            No articles published yet. Check back soon.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/articles/${post.slug}`}
                className="group rounded-lg border border-[var(--border)] p-5 transition-colors hover:border-[var(--fg-muted)]"
              >
                {post.coverImageUrl && (
                  <Image
                    src={post.coverImageUrl}
                    alt=""
                    width={600}
                    height={338}
                    className="mb-4 aspect-video w-full rounded-md object-cover"
                  />
                )}
                <h2 className="text-lg font-medium text-[var(--fg)] group-hover:underline">
                  {post.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--fg-muted)] line-clamp-2">
                  {post.description}
                </p>
                {post.publishedAt && (
                  <time
                    className="mt-3 block text-xs text-[var(--fg-subtle)]"
                    dateTime={new Date(post.publishedAt).toISOString()}
                  >
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
