export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; cid: string }> }
) {
  const { cid } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = await request.json() as { content: string };
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  await db.execute(
    "UPDATE album_comments SET content = ?, edited_at = datetime('now') WHERE id = ?",
    [body.content.trim(), cid]
  );

  const updated = await db.queryFirst(
    "SELECT * FROM album_comments WHERE id = ?", [cid]
  );
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; cid: string }> }
) {
  const { cid } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  await db.execute("DELETE FROM album_comments WHERE id = ?", [cid]);
  return NextResponse.json({ success: true });
}