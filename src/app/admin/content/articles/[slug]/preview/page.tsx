import Image from "next/image";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import {
  ComparisonTableSection,
  FaqSection,
  RelatedProductsSection,
  buildFaqPageSchema,
} from "@/components/marketing/article-extras";
import { getPost } from "@/lib/content";
import { Badge } from "@/components/ui/badge";

const SITE_URL =
  process.env.APP_URL?.replace(/\/+$/, "") ?? "https://dunamisstudios.net";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PreviewArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost("article", slug);
  if (!post) notFound();

  // The admin preview is a faithful representation of what the public
  // /articles/[slug] page will render once published. Keep section
  // ordering and FAQPage JSON-LD output identical to that route so
  // editors can verify everything that ships to production from here.
  const faqPageSchema =
    post.faq && post.faq.length > 0
      ? buildFaqPageSchema(post.faq, {
          name: `${post.title} FAQ`,
          description: `Frequently asked questions about ${post.title}.`,
          url: `${SITE_URL}/articles/${slug}`,
        })
      : null;

  return (
    <Section>
      <Container size="prose">
        {faqPageSchema ? (
          <JsonLd
            id={`jsonld-article-${slug}-faq`}
            schema={faqPageSchema}
          />
        ) : null}
        <div className="mb-4">
          <Badge variant={post.status === "published" ? "success" : "neutral"}>
            {post.status} - admin preview
          </Badge>
        </div>
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
        <article
          className="kb-prose mt-10"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
        {post.comparisonTable && post.comparisonTable.rows.length > 0 ? (
          <ComparisonTableSection table={post.comparisonTable} />
        ) : null}
        {post.faq && post.faq.length > 0 ? (
          <FaqSection faq={post.faq} />
        ) : null}
        {post.relatedProducts && post.relatedProducts.length > 0 ? (
          <RelatedProductsSection slugs={post.relatedProducts} />
        ) : null}
      </Container>
    </Section>
  );
}
