import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container, Section } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { getPost } from "@/lib/content";
import { buildArticleJsonLd, getOgImageUrl, computeReadingTime } from "@/lib/post-seo";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost("guide", slug);
  if (!post || post.status !== "published") return {};
  const ogImage = getOgImageUrl(post, "guide");
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/guides/${slug}`,
      images: [{ url: ogImage }],
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost("guide", slug);
  if (!post || post.status !== "published") notFound();

  const jsonLd = buildArticleJsonLd(post, "guide");
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${SITE_URL}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/guides/${slug}`,
      },
    ],
  };
  const readingTime = computeReadingTime(post.contentHtml);

  return (
    <Section>
      <Container size="sm">
        <JsonLd id={`jsonld-guide-${slug}`} schema={jsonLd} />
        <JsonLd
          id={`jsonld-guide-${slug}-breadcrumb`}
          schema={breadcrumbSchema}
        />
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: "/guides" },
            { label: post.title },
          ]}
          className="mb-5"
        />
        {post.coverImageUrl && (
          <Image
            src={post.coverImageUrl}
            alt=""
            width={800}
            height={450}
            className="mb-8 aspect-video w-full rounded-lg object-cover"
          />
        )}
        <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl font-medium tracking-tight text-[var(--fg)]">
          {post.title}
        </h1>
        <p className="mt-3 text-[var(--fg-muted)]">{post.description}</p>
        {post.publishedAt && (
          <div className="mt-2 flex items-center gap-3 text-sm text-[var(--fg-subtle)]">
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden>·</span>
            <span>{readingTime} min read</span>
          </div>
        )}
        <article
          className="kb-prose mt-10"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </Container>
    </Section>
  );
}
