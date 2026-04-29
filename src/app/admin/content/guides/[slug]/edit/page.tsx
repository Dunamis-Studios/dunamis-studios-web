import { notFound } from "next/navigation";
import { getPost } from "@/lib/content";
import { PostEditor } from "@/components/admin/post-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditGuidePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost("guide", slug);
  if (!post) notFound();

  return (
    <PostEditor
      type="guide"
      initial={{
        slug: post.slug,
        title: post.title,
        description: post.description,
        contentHtml: post.contentHtml,
        status: post.status,
        coverImageUrl: post.coverImageUrl,
        targetKeyword: post.targetKeyword,
        faq: post.faq,
        comparisonTable: post.comparisonTable,
        relatedProducts: post.relatedProducts,
      }}
    />
  );
}
