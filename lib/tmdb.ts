// lib/tmdb.ts
// TMDb API v3 - free tier compatible

import type { TMDbSearchResult, TMDbMovieDetails } from "@/types";

const BASE = "https://api.themoviedb.org/3";

function apiKey(): string {
  return (
    process.env.NEXT_PUBLIC_TMDB_API_KEY ||
    process.env.TMDB_API_KEY ||
    ""
  );
}

export async function searchMovies(query: string): Promise<TMDbSearchResult[]> {
  const key = apiKey();
  if (!key || !query.trim()) return [];
  const url = `${BASE}/search/movie?api_key=${key}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json() as { results?: TMDbSearchResult[] };
    return (data.results ?? []).slice(0, 8) as TMDbSearchResult[];
  } catch {
    return [];
  }
}

export async function getMovieDetails(tmdbId: number): Promise<TMDbMovieDetails | null> {
  const key = apiKey();
  if (!key) return null;
  const url = `${BASE}/movie/${tmdbId}?api_key=${key}&language=en-US`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as TMDbMovieDetails;
  } catch {
    return null;
  }
}

export function posterUrl(path?: string | null, size: "w185" | "w342" | "w500" | "original" = "w500"): string {
  if (!path) return "/placeholder-poster.svg";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export const TMDB_GENRES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
  878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
};

export function genreNameFromIds(ids?: number[]): string {
  if (!ids || ids.length === 0) return "Unknown";
  return TMDB_GENRES[ids[0]] ?? "Other";
}
