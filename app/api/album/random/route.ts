export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_: NextRequest) {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const photo = await db.queryFirst(
    "SELECT * FROM album_photos ORDER BY RANDOM() LIMIT 1"
  );
  if (!photo) return NextResponse.json({ error: "No photos yet" }, { status: 404 });
  return NextResponse.json({ data: photo });
}
