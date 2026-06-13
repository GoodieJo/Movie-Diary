import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_: NextRequest) {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const now = new Date();
  const thisYear  = now.getFullYear().toString();
  const thisMonth = `${thisYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [
    total, thisYearCount, thisMonthCount, avgRating,
    genreRows, monthRows, ratingsRows, longestMovie, highestRated,
  ] = await Promise.all([
    db.queryFirst<{ cnt: number }>("SELECT COUNT(*) as cnt FROM diary_entries"),
    db.queryFirst<{ cnt: number }>("SELECT COUNT(*) as cnt FROM diary_entries WHERE strftime('%Y', watched_date) = ?", [thisYear]),
    db.queryFirst<{ cnt: number }>("SELECT COUNT(*) as cnt FROM diary_entries WHERE strftime('%Y-%m', watched_date) = ?", [thisMonth]),
    db.queryFirst<{ avg: number }>("SELECT AVG((COALESCE(your_rating,0)+COALESCE(partner_rating,0))/2.0) as avg FROM diary_entries WHERE your_rating IS NOT NULL OR partner_rating IS NOT NULL"),
    db.query<{ genre: string; cnt: number }>("SELECT m.genre, COUNT(*) as cnt FROM diary_entries de JOIN movies m ON m.id = de.movie_id WHERE m.genre IS NOT NULL GROUP BY m.genre ORDER BY cnt DESC"),
    db.query<{ month: string; cnt: number }>("SELECT strftime('%Y-%m', watched_date) as month, COUNT(*) as cnt FROM diary_entries GROUP BY month ORDER BY month DESC LIMIT 12"),
    db.query<{ stars: number; cnt: number }>("SELECT CAST(ROUND((COALESCE(your_rating,0)+COALESCE(partner_rating,0))/2.0) AS INTEGER) as stars, COUNT(*) as cnt FROM diary_entries WHERE your_rating IS NOT NULL GROUP BY stars"),
    db.queryFirst<{ title: string; runtime: number }>("SELECT m.title, m.runtime FROM diary_entries de JOIN movies m ON m.id = de.movie_id WHERE m.runtime IS NOT NULL ORDER BY m.runtime DESC LIMIT 1"),
    db.queryFirst<{ title: string; rating: number }>("SELECT m.title, ROUND((COALESCE(de.your_rating,0)+COALESCE(de.partner_rating,0))/2.0,1) as rating FROM diary_entries de JOIN movies m ON m.id = de.movie_id WHERE de.your_rating IS NOT NULL ORDER BY rating DESC LIMIT 1"),
  ]);

  const byGenre = genreRows.map(r => ({ genre: r.genre, count: Number(r.cnt) }));

  return NextResponse.json({
    total_movies:       Number(total?.cnt ?? 0),
    movies_this_year:   Number(thisYearCount?.cnt ?? 0),
    movies_this_month:  Number(thisMonthCount?.cnt ?? 0),
    avg_rating:         Math.round(Number(avgRating?.avg ?? 0) * 10) / 10,
    most_watched_genre: byGenre[0]?.genre ?? null,
    longest_movie:      longestMovie ?? null,
    highest_rated:      highestRated ?? null,
    by_genre:           byGenre,
    by_month:           monthRows.map(r => ({ month: r.month, count: Number(r.cnt) })).reverse(),
    ratings_distribution: ratingsRows.map(r => ({ stars: Math.round(Number(r.stars)), count: Number(r.cnt) })),
  });
}
