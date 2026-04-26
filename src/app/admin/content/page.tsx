import Link from "next/link";
import { listPosts } from "@/lib/content";
import type { Post } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { DeletePostButton } from "@/components/admin/delete-post-button";

export default async function AdminContentPage() {
  const [guides, articles] = await Promise.all([
    listPosts("guide", { includeDrafts: true }),
    listPosts("article", { includeDrafts: true }),
  ]);

  return (
    <div className="space-y-12">
      <ContentSection
        title="Guides"
        type="guides"
        posts={guides}
      />
      <ContentSection
        title="Articles"
        type="articles"
        posts={articles}
      />
    </div>
  );
}

function ContentSection({
  title,
  type,
  posts,
}: {
  title: string;
  type: "guides" | "articles";
  posts: Post[];
}) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-[var(--fg)]">{title}</h2>
        <Link
          href={`/admin/content/${type}/new`}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90"
        >
          New {title.slice(0, -1)}
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--fg-muted)]">
          No {title.toLowerCase()} yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--fg-muted)]">Title</th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--fg-muted)]">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--fg-muted)]">Updated</th>
                <th className="px-4 py-2.5 text-right font-medium text-[var(--fg-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {posts.map((post) => (
                <tr key={post.slug}>
                  <td className="px-4 py-3 text-[var(--fg)]">{post.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={post.status === "published" ? "success" : "neutral"}>
                      {post.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-muted)]">
                    {new Date(post.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/content/${type}/${post.slug}/edit`}
                        className="text-sm text-[var(--accent)] hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/content/${type}/${post.slug}/preview`}
                        target="_blank"
                        className="text-sm text-[var(--fg-muted)] hover:underline"
                      >
                        Preview
                      </Link>
                      <DeletePostButton type={type} slug={post.slug} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
