export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_: NextRequest) {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  // Get latest 20 comments with their photo's image_url
  const comments = await db.query(`
    SELECT
      ac.id,
      ac.photo_id,
      ac.author,
      ac.emoji,
      ac.content,
      ac.created_at,
      ap.image_url
    FROM album_comments ac
    JOIN album_photos ap ON ap.id = ac.photo_id
    ORDER BY ac.created_at DESC
    LIMIT 20
  `);

  return NextResponse.json({ data: comments });
}