/**
 * Delete a guide or article from the /admin/content editor. Wraps a
 * window.confirm prompt and posts to /api/admin/content/{type}/{slug}
 * with method DELETE. On success, routes back to the type's index
 * page so the deleted post can't be re-edited from a stale URL.
 */
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

export function DeletePostButton({
  type,
  slug,
}: {
  type: "guides" | "articles";
  slug: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!confirm(`Delete this ${type.slice(0, -1)}? This cannot be undone.`)) return;
    setDeleting(true);
    const contentType = type === "guides" ? "guide" : "article";
    const res = await fetch(
      `/api/admin/content?type=${contentType}&slug=${encodeURIComponent(slug)}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      router.refresh();
    } else {
      alert("Delete failed");
    }
    setDeleting(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-[var(--color-danger)] hover:underline disabled:opacity-50"
    >
      Delete
    </button>
  );
}
