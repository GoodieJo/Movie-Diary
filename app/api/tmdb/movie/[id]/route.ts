import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tmdbId = parseInt(id);
  if (isNaN(tmdbId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const movie = await getMovieDetails(tmdbId);
  if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: movie });
}
