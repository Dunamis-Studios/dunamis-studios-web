/**
 * POST /api/admin/content/images: image upload endpoint for the
 * post editor. Uploads to Vercel Blob under the private "content/"
 * prefix, then writes a Redis metadata record keyed by a fresh
 * UUID so the editor can reference the image by id and the admin
 * tools can list uploaded images later.
 *
 * Filenames carry a Date.now() prefix so re-uploads can't collide,
 * which avoids needing allowOverwrite (and the destructive overwrite
 * semantics it would otherwise allow on shared filenames).
 */
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/session";
import { redis, KEY } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "No valid image file provided" }, { status: 400 });
  }

  // Store is configured as "private"; "public" returns a 500 error from the
  // Vercel Blob API. Filenames carry a Date.now() prefix so re-uploads can't
  // collide, removing the need for allowOverwrite.
  const blob = await put(`content/${Date.now()}-${file.name}`, file, {
    access: "private",
    contentType: file.type,
  });

  // Store metadata in Redis
  const id = crypto.randomUUID();
  const r = redis();
  await r.set(KEY.image(id), {
    id,
    blobUrl: blob.url,
    uploadedAt: Date.now(),
    uploadedBy: session.account.accountId,
  });

  return NextResponse.json({ url: blob.url });
}
