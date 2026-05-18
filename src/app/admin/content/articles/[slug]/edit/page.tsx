/**
 * /admin/content/articles/[slug]/edit: edit a specific article by
 * slug. Loads the persisted post (including draft state), shapes it
 * into the PostEditor's `initial` prop, and renders the same editor
 * component used by the create route. notFound() when the slug
 * doesn't resolve so admins get the 404 page rather than an empty
 * editor.
 */
import { notFound } from "next/navigation";
import { getPost } from "@/lib/content";
import { PostEditor } from "@/components/admin/post-editor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost("article", slug);
  if (!post) notFound();

  return (
    <PostEditor
      type="article"
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
