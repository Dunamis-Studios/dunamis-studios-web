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

  const blob = await put(`content/${Date.now()}-${file.name}`, file, {
    access: "public",
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
