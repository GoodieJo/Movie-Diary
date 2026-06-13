"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TMDbSearchResult, TMDbMovieDetails } from "@/types";
import { posterUrl, genreNameFromIds } from "@/lib/tmdb";

interface TMDbSearchProps {
  onSelect: (movie: {
    tmdb_id: number;
    title: string;
    poster_url: string;
    genre: string;
    runtime?: number;
    overview?: string;
  }) => void;
  initialTitle?: string;
}

export function TMDbSearch({ onSelect, initialTitle = "" }: TMDbSearchProps) {
  const [query, setQuery] = useState(initialTitle);
  const [results, setResults] = useState<TMDbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(initialTitle);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query.trim() || query === selected) { setResults([]); return; }

    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
        const data = await res.json() as { results?: TMDbSearchResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [query, selected]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleSelect(movie: TMDbSearchResult) {
    setLoading(true);
    setOpen(false);

    try {
      // Fetch full details to get runtime
      const res = await fetch(`/api/tmdb/movie/${movie.id}`);
      let runtime = movie.runtime;
      let genre = genreNameFromIds(movie.genre_ids);

      if (res.ok) {
        const detail = ((await res.json()) as { data: TMDbMovieDetails }).data;
        runtime = detail.runtime ?? runtime;
        genre = detail.genres?.[0]?.name ?? genre;
      }

      const title = movie.title;
      setQuery(title);
      setSelected(title);

      onSelect({
        tmdb_id: movie.id,
        title,
        poster_url: posterUrl(movie.poster_path),
        genre,
        runtime,
        overview: movie.overview,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e7a60]" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(""); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search TMDb for a movie..."
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition"
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-rose-400" />}
        {query && !loading && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSelected(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8a090] hover:text-[#3d2b1f]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e8dcc8] rounded-xl shadow-lift z-50 overflow-hidden max-h-80 overflow-y-auto"
          >
            {results.map(movie => (
              <button
                key={movie.id}
                type="button"
                onClick={() => handleSelect(movie)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50 transition-colors text-left border-b border-[#f0e6d2] last:border-0"
              >
                <div className="flex-shrink-0 w-9 h-13 rounded overflow-hidden bg-[#f0e6d2]">
                  {movie.poster_path ? (
                    <Image
                      src={posterUrl(movie.poster_path, "w185")}
                      alt={movie.title}
                      width={36}
                      height={54}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-9 h-14 flex items-center justify-center text-xl">🎬</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#3d2b1f] truncate">{movie.title}</p>
                  <p className="text-xs text-[#9e7a60]">
                    {movie.release_date?.slice(0, 4)} · {genreNameFromIds(movie.genre_ids)}
                  </p>
                  {movie.overview && (
                    <p className="text-xs text-[#b8a090] mt-0.5 line-clamp-1">{movie.overview}</p>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!process.env.NEXT_PUBLIC_TMDB_API_KEY && (
        <p className="text-xs text-amber-600 mt-1 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          ⚠️ Set NEXT_PUBLIC_TMDB_API_KEY in .env.local to enable movie search
        </p>
      )}
    </div>
  );
}
