import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (!query.trim()) return NextResponse.json({ results: [] });

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "";
  if (!apiKey) return NextResponse.json({ results: [] });

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = await res.json() as { results?: unknown[] };
    return NextResponse.json({ results: (data.results ?? []).slice(0, 8) });
  } catch {
    return NextResponse.json({ results: [] });
  }
}