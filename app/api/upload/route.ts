import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file    = formData.get("file")     as File | null;
  const entryId = formData.get("entry_id") as string | null;
  const label   = formData.get("label")    as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Try Cloudflare R2 first
  let url: string;
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx    = getRequestContext();
    const bucket = (ctx.env as Record<string, unknown>).PHOTOS_BUCKET as {
      put(key: string, body: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }): Promise<void>;
    } | undefined;

    if (bucket) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const key = `photos/${entryId ?? "misc"}/${Date.now()}.${ext}`;
      await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
      url = `/api/photos/${key}`;
    } else {
      // Local dev: use a stable picsum placeholder keyed by filename
      url = `https://picsum.photos/seed/${encodeURIComponent(file.name)}/400/600`;
    }
  } catch {
    // Not in Cloudflare — local dev placeholder
    url = `https://picsum.photos/seed/${Date.now()}/400/600`;
  }

  // Save photo record to DB
  if (entryId) {
    const db = await getDb();
    if (db) {
      await db.execute(
        "INSERT INTO photos (entry_id, url, label) VALUES (?,?,?)",
        [parseInt(entryId), url, label ?? null]
      );
    }
  }

  return NextResponse.json({ url });
}
