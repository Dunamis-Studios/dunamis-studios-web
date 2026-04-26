import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getPost, savePost, deletePost, generateUniqueSlug } from "@/lib/content";
import type { ContentType, Post } from "@/lib/content";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();

  const body = await req.json();
  const { type, title, slug, description, contentHtml, status, coverImageUrl, targetKeyword } = body as {
    type: ContentType;
    title: string;
    slug?: string;
    description: string;
    contentHtml: string;
    status: "draft" | "published";
    coverImageUrl?: string;
    targetKeyword?: string;
  };

  if (!type || !title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const baseSlug = slug ? slugify(slug) : slugify(title);
  if (!baseSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const finalSlug = await generateUniqueSlug(type, baseSlug);
  const now = Date.now();

  const post: Post = {
    slug: finalSlug,
    title,
    description,
    contentHtml: contentHtml || "",
    status,
    coverImageUrl: coverImageUrl || undefined,
    targetKeyword: targetKeyword || undefined,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === "published" ? now : undefined,
    authorAccountId: session.account.accountId,
  };

  await savePost(type, post);
  return NextResponse.json({ post }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const { type, slug, title, description, contentHtml, status, coverImageUrl, targetKeyword } = body as {
    type: ContentType;
    slug: string;
    title: string;
    description: string;
    contentHtml: string;
    status: "draft" | "published";
    coverImageUrl?: string;
    targetKeyword?: string;
  };

  if (!type || !slug || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await getPost(type, slug);
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const now = Date.now();
  const post: Post = {
    ...existing,
    title,
    description,
    contentHtml: contentHtml || "",
    status,
    coverImageUrl: coverImageUrl || undefined,
    targetKeyword: targetKeyword || undefined,
    updatedAt: now,
    publishedAt:
      status === "published" && !existing.publishedAt
        ? now
        : existing.publishedAt,
    authorAccountId: existing.authorAccountId,
  };

  await savePost(type, post);
  return NextResponse.json({ post });
}

export async function DELETE(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as ContentType | null;
  const slug = searchParams.get("slug");

  if (!type || !slug) {
    return NextResponse.json({ error: "Missing type or slug" }, { status: 400 });
  }

  await deletePost(type, slug);
  return NextResponse.json({ ok: true });
}
