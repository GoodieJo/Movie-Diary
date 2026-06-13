import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_: NextRequest) {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const entry = await db.queryFirst(
    `SELECT de.*, m.title, m.poster_url, m.genre, m.runtime, m.overview, m.tmdb_id
     FROM diary_entries de JOIN movies m ON m.id = de.movie_id
     ORDER BY RANDOM() LIMIT 1`
  );
  if (!entry) return NextResponse.json({ error: "No entries yet" }, { status: 404 });

  const photos = await db.query("SELECT * FROM photos WHERE entry_id = ?", [entry.id as number]);
  return NextResponse.json({ data: { ...entry, photos } });
}
