import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db-adapter";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const entryId = parseInt(id);
  if (isNaN(entryId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const entry = await db.queryFirst(
    `SELECT de.*, m.title, m.poster_url, m.genre, m.runtime, m.overview, m.tmdb_id
     FROM diary_entries de JOIN movies m ON m.id = de.movie_id WHERE de.id = ?`,
    [entryId]
  );
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const photos = await db.query("SELECT * FROM photos WHERE entry_id = ?", [entryId]);
  return NextResponse.json({ data: { ...entry, photos } });
}

const UpdateSchema = z.object({
  watched_date:       z.string().optional(),
  start_time:         z.string().optional(),
  end_time:           z.string().optional(),
  your_rating:        z.number().min(1).max(5).optional(),
  partner_rating:     z.number().min(1).max(5).optional(),
  favorite_scene:     z.string().optional(),
  favorite_character: z.string().optional(),
  best_quote:         z.string().optional(),
  laugh_memory:       z.string().optional(),
  cry_memory:         z.string().optional(),
  special_memory:     z.string().optional(),
  mood_before:        z.string().optional(),
  mood_after:         z.string().optional(),
  location:           z.string().optional(),
  snacks:             z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const entryId = parseInt(id);
  if (isNaN(entryId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json() as unknown;
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 422 });

  const d = parsed.data;
  const entries = Object.entries(d).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const fields = entries.map(([k]) => `${k} = ?`).join(", ");
  const values = entries.map(([, v]) => v);

  await db.execute(`UPDATE diary_entries SET ${fields} WHERE id = ?`, [...values, entryId]);

  const updated = await db.queryFirst(
    `SELECT de.*, m.title, m.poster_url, m.genre, m.runtime, m.overview, m.tmdb_id
     FROM diary_entries de JOIN movies m ON m.id = de.movie_id WHERE de.id = ?`,
    [entryId]
  );
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const entryId = parseInt(id);
  if (isNaN(entryId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await db.execute("DELETE FROM diary_entries WHERE id = ?", [entryId]);
  return NextResponse.json({ success: true });
}
