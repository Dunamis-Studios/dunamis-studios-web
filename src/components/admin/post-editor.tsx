"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "./tiptap-editor";

interface PostEditorProps {
  type: "guide" | "article";
  initial?: {
    slug: string;
    title: string;
    description: string;
    contentHtml: string;
    status: "draft" | "published";
    coverImageUrl?: string;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function PostEditor({ type, initial }: PostEditorProps) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [contentHtml, setContentHtml] = React.useState(initial?.contentHtml ?? "");
  const [coverImageUrl, setCoverImageUrl] = React.useState(initial?.coverImageUrl ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [slugTouched, setSlugTouched] = React.useState(isEdit);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function save(status: "draft" | "published") {
    setSaving(true);
    setError("");

    const payload = {
      type,
      title,
      slug,
      description,
      contentHtml,
      status,
      coverImageUrl: coverImageUrl || undefined,
    };

    try {
      const res = await fetch("/api/admin/content", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Save failed (${res.status})`);
        setSaving(false);
        return;
      }

      const data = await res.json();
      if (!isEdit && data.post?.slug) {
        router.push(`/admin/content/${type}s/${data.post.slug}/edit`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-[var(--fg)]">
          {isEdit ? "Edit" : "New"} {type === "guide" ? "Guide" : "Article"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => save("draft")}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--fg)] hover:bg-[var(--bg-subtle)] disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save("published")}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-fg)] hover:opacity-90 disabled:opacity-50"
          >
            Publish
          </button>
          {isEdit && (
            <a
              href={`/admin/content/${type}s/${slug}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]"
            >
              Preview
            </a>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-[var(--color-danger)] bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] px-4 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              placeholder="Post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              disabled={isEdit}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] disabled:opacity-60"
              placeholder="auto-generated-from-title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              placeholder="Short description for index cards and SEO"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-1">Content</label>
            <TiptapEditor content={contentHtml} onChange={setContentHtml} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-1">Cover Image</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={async () => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    const res = await fetch("/api/admin/content/images", {
                      method: "POST",
                      body: formData,
                    });
                    if (res.ok) {
                      const { url } = await res.json();
                      setCoverImageUrl(url);
                    }
                  };
                  input.click();
                }}
                className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)]"
              >
                Upload
              </button>
            </div>
            {coverImageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="mt-2 aspect-video w-full rounded-md border border-[var(--border)] object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
