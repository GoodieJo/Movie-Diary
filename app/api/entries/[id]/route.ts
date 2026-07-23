export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db-adapter";

const numOrUndefined = z.preprocess((v) => {
  if (v === null || v === "" || v === undefined) return undefined;
  return typeof v === "string" ? Number(v) : v;
}, z.number().optional());

const ratingOrUndefined = z.preprocess((v) => {
  if (v === null || v === "" || v === undefined) return undefined;
  return typeof v === "string" ? Number(v) : v;
}, z.number().min(1).max(10).optional());

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
    `SELECT de.*, m.title, m.poster_url, m.genre, m.runtime, m.overview, m.tmdb_id, m.media_type
     FROM diary_entries de JOIN movies m ON m.id = de.movie_id WHERE de.id = ?`,
    [entryId]
  );
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [photos, episodes] = await Promise.all([
    db.query("SELECT * FROM photos WHERE entry_id = ?", [entryId]),
    db.query("SELECT * FROM episodes WHERE entry_id = ? ORDER BY episode_number", [entryId]),
  ]);
  return NextResponse.json({ data: { ...entry, photos, episodes } });
}

const UpdateSchema = z.object({
  watched_date:       z.string().optional(),
  start_time:         z.string().optional(),
  end_time:           z.string().optional(),
  your_rating:        ratingOrUndefined,
  partner_rating:     ratingOrUndefined,
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
  // Movie table fields
  poster_url:         z.string().optional(),
  genre:              z.string().optional(),
  runtime:            numOrUndefined,
  // Series episodes — replaces all episodes for the entry and recomputes
  // watched_date/start_time/end_time from the latest one when present.
  episodes: z.array(z.object({
    watched_date: z.string().min(1),
    start_time:   z.string().optional(),
    end_time:     z.string().optional(),
  })).optional(),
});

const ENTRY_FIELDS = [
  "watched_date","start_time","end_time","your_rating","partner_rating",
  "favorite_scene","favorite_character","best_quote","laugh_memory","cry_memory",
  "special_memory","mood_before","mood_after","location","snacks",
];
const MOVIE_FIELDS = ["poster_url","genre","runtime"];

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const entryId = parseInt(id);
  if (isNaN(entryId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[PUT validation]", parsed.error.issues);
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  const d = parsed.data as Record<string, unknown>;
  const episodes = d.episodes as { watched_date: string; start_time?: string; end_time?: string }[] | undefined;

  const entryEntries = Object.entries(d).filter(([k, v]) => ENTRY_FIELDS.includes(k) && v !== undefined);
  const movieEntries = Object.entries(d).filter(([k, v]) => MOVIE_FIELDS.includes(k) && v !== undefined);

  if (entryEntries.length === 0 && movieEntries.length === 0 && !episodes) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    if (entryEntries.length > 0) {
      const fields = entryEntries.map(([k]) => `${k} = ?`).join(", ");
      const values = entryEntries.map(([, v]) => v);
      await db.execute(`UPDATE diary_entries SET ${fields} WHERE id = ?`, [...values, entryId]);
    }

    if (movieEntries.length > 0) {
      const entryRow = await db.queryFirst<{ movie_id: number }>(
        "SELECT movie_id FROM diary_entries WHERE id = ?", [entryId]
      );
      if (entryRow) {
        const fields = movieEntries.map(([k]) => `${k} = ?`).join(", ");
        const values = movieEntries.map(([, v]) => v);
        await db.execute(`UPDATE movies SET ${fields} WHERE id = ?`, [...values, entryRow.movie_id]);
      }
    }

    if (episodes && episodes.length > 0) {
      await db.execute("DELETE FROM episodes WHERE entry_id = ?", [entryId]);
      const sorted = [...episodes].sort((a, b) => a.watched_date.localeCompare(b.watched_date));
      for (let i = 0; i < sorted.length; i++) {
        const ep = sorted[i];
        await db.execute(
          "INSERT INTO episodes (entry_id, episode_number, watched_date, start_time, end_time) VALUES (?,?,?,?,?)",
          [entryId, i + 1, ep.watched_date, ep.start_time ?? null, ep.end_time ?? null]
        );
      }
      const latest = sorted[sorted.length - 1];
      await db.execute(
        "UPDATE diary_entries SET watched_date = ?, start_time = ?, end_time = ? WHERE id = ?",
        [latest.watched_date, latest.start_time ?? null, latest.end_time ?? null, entryId]
      );
    }

    const updated = await db.queryFirst(
      `SELECT de.*, m.title, m.poster_url, m.genre, m.runtime, m.overview, m.tmdb_id, m.media_type
       FROM diary_entries de JOIN movies m ON m.id = de.movie_id WHERE de.id = ?`,
      [entryId]
    );
    const updatedEpisodes = await db.query(
      "SELECT * FROM episodes WHERE entry_id = ? ORDER BY episode_number", [entryId]
    );
    return NextResponse.json({ data: { ...updated, episodes: updatedEpisodes } });
  } catch (err) {
    console.error("[PUT /api/entries/:id]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
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