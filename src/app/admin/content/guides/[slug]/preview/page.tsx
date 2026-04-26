import Image from "next/image";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/primitives";
import { getPost } from "@/lib/content";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PreviewGuidePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost("guide", slug);
  if (!post) notFound();

  return (
    <Section>
      <Container size="sm">
        <div className="mb-4">
          <Badge variant={post.status === "published" ? "success" : "neutral"}>
            {post.status} — admin preview
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
      </Container>
    </Section>
  );
}
