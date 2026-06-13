import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tmdbId = parseInt(id);
  if (isNaN(tmdbId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? "";
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 503 });

  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=en-US`;

  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = await res.json();
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}