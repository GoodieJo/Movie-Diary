export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const photoId = parseInt(id);
  if (isNaN(photoId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await db.execute("DELETE FROM photos WHERE id = ?", [photoId]);
  return NextResponse.json({ success: true });
}