import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/primitives";
import { getPost } from "@/lib/content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost("guide", slug);
  if (!post || post.status !== "published") return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `/guides/${slug}`,
      ...(post.coverImageUrl && { images: [{ url: post.coverImageUrl }] }),
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost("guide", slug);
  if (!post || post.status !== "published") notFound();

  return (
    <Section>
      <Container size="sm">
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
          <time
            className="mt-2 block text-sm text-[var(--fg-subtle)]"
            dateTime={new Date(post.publishedAt).toISOString()}
          >
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
        <article
          className="kb-prose mt-10"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </Container>
    </Section>
  );
}
