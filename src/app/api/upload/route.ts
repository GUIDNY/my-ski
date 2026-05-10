import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "apartments";

export async function POST(req: NextRequest) {
  const db = createServerClient();

  // Ensure bucket exists
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.find(b => b.name === BUCKET)) {
    await db.storage.createBucket(BUCKET, { public: true });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext      = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes    = await file.arrayBuffer();

  const { error } = await db.storage.from(BUCKET).upload(filename, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(filename);
  return NextResponse.json({ url: publicUrl });
}
