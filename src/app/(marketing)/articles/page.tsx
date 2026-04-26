import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, PageHeader } from "@/components/ui/primitives";
import { listPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "News, updates, and insights from the Dunamis Studios team.",
  alternates: { canonical: "/articles" },
};

export default async function ArticlesPage() {
  const posts = await listPosts("article", { includeDrafts: false });

  return (
    <Section>
      <Container>
        <PageHeader
          title="Articles"
          description="News, updates, and insights from the Dunamis Studios team."
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
                  <img
                    src={post.coverImageUrl}
                    alt=""
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
