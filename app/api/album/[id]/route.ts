export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const photo = await db.queryFirst("SELECT * FROM album_photos WHERE id = ?", [id]);
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: photo });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const body = await request.json() as Record<string, unknown>;
  const allowed = ["caption", "taken_date", "favorite"];
  const entries = Object.entries(body).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return NextResponse.json({ error: "No fields" }, { status: 400 });

  const fields = entries.map(([k]) => `${k} = ?`).join(", ");
  const values = entries.map(([, v]) => v);
  await db.execute(`UPDATE album_photos SET ${fields} WHERE id = ?`, [...values, id]);

  const updated = await db.queryFirst("SELECT * FROM album_photos WHERE id = ?", [id]);
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  // Get r2_key before deleting so we can clean up R2 too
  const photo = await db.queryFirst<{ r2_key: string }>(
    "SELECT r2_key FROM album_photos WHERE id = ?", [id]
  );

  if (photo?.r2_key) {
    // Attempt R2 deletion — ignore failure (best-effort cleanup)
    try {
      const { getRequestContext } = await import("@cloudflare/next-on-pages");
      const ctx    = getRequestContext();
      const bucket = (ctx.env as Record<string, unknown>).PHOTOS_BUCKET as {
        delete(key: string): Promise<void>;
      } | undefined;
      if (bucket) await bucket.delete(photo.r2_key);
    } catch { /* not on CF or R2 unavailable */ }
  }

  await db.execute("DELETE FROM album_photos WHERE id = ?", [id]);
  return NextResponse.json({ success: true });
}
