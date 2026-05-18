/**
 * /admin/content/guides/new: shell that mounts the shared
 * PostEditor in "create guide" mode. Guides differ from articles
 * only at the routing and listing layer; the editor itself is
 * identical so the same component drives both flows.
 */
import { PostEditor } from "@/components/admin/post-editor";

export default function NewGuidePage() {
  return <PostEditor type="guide" />;
}
