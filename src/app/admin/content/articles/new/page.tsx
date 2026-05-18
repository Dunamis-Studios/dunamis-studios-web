/**
 * /admin/content/articles/new: thin route shell that mounts the
 * shared PostEditor client component in "create article" mode. The
 * editor handles slug derivation, draft saves, publish flips, and
 * the Tiptap rich-text surface; this route just hands it the
 * "article" type discriminator.
 */
import { PostEditor } from "@/components/admin/post-editor";

export default function NewArticlePage() {
  return <PostEditor type="article" />;
}
