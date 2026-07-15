import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db-adapter";
import { sendPush } from "@/lib/push";

export const runtime = "edge";

const EntrySchema = z.object({
  added_by:      z.enum(["1", "2"]).default("1"),
  tmdb_id:       z.preprocess((v) => (v === null || v === "" ? undefined : v), z.number().optional()),
  title:              z.string().min(1),
  poster_url:         z.string().optional(),
  genre:              z.string().optional(),
  runtime:       z.preprocess((v) => (v === null || v === "" ? undefined : v), z.number().optional()),
  overview:           z.string().optional(),
  watched_date:       z.string().min(1),
  start_time:         z.string().optional(),
  end_time:           z.string().optional(),
  your_rating:   z.preprocess((v) => (v === null || v === "" ? undefined : v), z.number().min(1).max(10).optional()),
  partner_rating:z.preprocess((v) => (v === null || v === "" ? undefined : v), z.number().min(1).max(10).optional()),
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

export async function GET(request: NextRequest) {
  const db = await getDb();
  if (!db) {
    return NextResponse.json({ items: [], total: 0, page: 1, pageSize: 20 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const genre  = searchParams.get("genre")  ?? "";
  const year   = searchParams.get("year")   ?? "";
  const sort   = searchParams.get("sort")   ?? "newest";
  const page   = parseInt(searchParams.get("page")  ?? "1");
  const limit  = parseInt(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit;

  const conditions: string[] = ["1=1"];
  const params: unknown[]    = [];

  if (search) { conditions.push("m.title LIKE ?"); params.push(`%${search}%`); }
  if (genre)  { conditions.push("m.genre = ?");    params.push(genre); }
  if (year)   { conditions.push("strftime('%Y', de.watched_date) = ?"); params.push(year); }

  const where = conditions.join(" AND ");
  const orderMap: Record<string, string> = {
    newest:        "de.watched_date DESC",
    oldest:        "de.watched_date ASC",
    highest_rated: "(COALESCE(de.your_rating,0) + COALESCE(de.partner_rating,0)) / 2.0 DESC",
  };
  const order = orderMap[sort] ?? orderMap.newest;

  const [entries, countRow] = await Promise.all([
    db.query(
      `SELECT de.*, m.title, m.poster_url, m.genre, m.runtime, m.overview, m.tmdb_id
       FROM diary_entries de JOIN movies m ON m.id = de.movie_id
       WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ),
    db.queryFirst<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM diary_entries de JOIN movies m ON m.id = de.movie_id WHERE ${where}`,
      params
    ),
  ]);

  if (entries.length > 0) {
    const ids = entries.map(e => e.id as number);
    const placeholders = ids.map(() => "?").join(",");
    const photos = await db.query(
      `SELECT * FROM photos WHERE entry_id IN (${placeholders})`, ids
    );
    const photoMap: Record<number, unknown[]> = {};
    for (const p of photos) {
      const eid = p.entry_id as number;
      if (!photoMap[eid]) photoMap[eid] = [];
      photoMap[eid].push(p);
    }
    for (const e of entries) {
      (e as Record<string, unknown>).photos = photoMap[e.id as number] ?? [];
    }
  }

  return NextResponse.json({
    items: entries,
    total: countRow?.cnt ?? 0,
    page,
    pageSize: limit,
  });
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not available. Check D1 binding in Cloudflare dashboard." },
      { status: 503 }
    );
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = EntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  const d = parsed.data;

  try {
    let movieRow = d.tmdb_id
      ? await db.queryFirst<{ id: number }>(
          "SELECT id FROM movies WHERE tmdb_id = ?", [d.tmdb_id]
        )
      : null;

    if (!movieRow) {
      await db.execute(
        "INSERT INTO movies (tmdb_id, title, poster_url, genre, runtime, overview) VALUES (?,?,?,?,?,?)",
        [d.tmdb_id ?? null, d.title, d.poster_url ?? null, d.genre ?? null, d.runtime ?? null, d.overview ?? null]
      );
      movieRow = await db.queryFirst<{ id: number }>(
        "SELECT id FROM movies ORDER BY id DESC LIMIT 1"
      );
    }

    if (!movieRow) throw new Error("Failed to create movie record");

    await db.execute(
      `INSERT INTO diary_entries
        (movie_id, watched_date, start_time, end_time, your_rating, partner_rating,
         favorite_scene, favorite_character, best_quote, laugh_memory, cry_memory,
         special_memory, mood_before, mood_after, location, snacks, added_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        movieRow.id,
        d.watched_date, d.start_time ?? null, d.end_time ?? null,
        d.your_rating ?? null, d.partner_rating ?? null,
        d.favorite_scene ?? null, d.favorite_character ?? null,
        d.best_quote ?? null, d.laugh_memory ?? null,
        d.cry_memory ?? null, d.special_memory ?? null,
        d.mood_before ?? null, d.mood_after ?? null,
        d.location ?? "Home", d.snacks ?? null, d.added_by,
      ]
    );

    const entry = await db.queryFirst<{ id: number }>(
      `SELECT de.*, m.title, m.poster_url, m.genre, m.runtime, m.overview, m.tmdb_id
       FROM diary_entries de JOIN movies m ON m.id = de.movie_id
       ORDER BY de.id DESC LIMIT 1`
    );

    // Awaited (not fire-and-forget) — Cloudflare Workers can terminate unawaited
    // promises once the response is returned unless wrapped in ctx.waitUntil.
    await sendPush(d.added_by, {
      title: "New diary entry 📖",
      body:  `"${d.title}" was just added to your diary.`,
      url:   entry ? `/entries/${entry.id}` : "/home",
    }).catch(() => {});

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/entries]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}