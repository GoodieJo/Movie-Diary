// lib/db.ts — shared DB helpers

export function getPosterUrl(path?: string | null): string {
  if (!path) return "/placeholder-poster.svg";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export function formatRuntime(minutes?: number | null): string {
  if (!minutes) return "Unknown";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function calcAvgRating(your?: number | null, partner?: number | null): number | null {
  if (your && partner) return (your + partner) / 2;
  if (your)    return your;
  if (partner) return partner;
  return null;
}
