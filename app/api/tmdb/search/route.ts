import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (!query.trim()) return NextResponse.json({ results: [] });
  const results = await searchMovies(query);
  return NextResponse.json({ results });
}
