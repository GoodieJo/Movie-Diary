"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { DiaryEntry } from "@/types";
import { getYear, getMonthName, formatShortDate } from "@/lib/utils";

type Grouped = Record<string, Record<string, DiaryEntry[]>>;

export default function TimelinePage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [years, setYears] = useState<{ year: string; count: number }[]>([]);
  const [year, setYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearLoading, setYearLoading] = useState(false);

  // Which years have entries (newest first); open on the latest one
  useEffect(() => {
    fetch("/api/entries?limit=1&withYears=1")
      .then(r => r.json() as Promise<{ years?: { year: string; count: number }[] }>)
      .then(d => {
        const ys = d.years ?? [];
        setYears(ys);
        setYear(ys[0]?.year ?? null);
        if (ys.length === 0) setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load every entry of the selected year (no cap)
  useEffect(() => {
    if (!year) return;
    let cancelled = false;
    setYearLoading(true);
    fetch(`/api/entries?sort=newest&year=${year}&limit=1000`)
      .then(r => r.json() as Promise<{ items: DiaryEntry[] }>)
      .then(d => { if (!cancelled) setEntries(d.items ?? []); })
      .finally(() => { if (!cancelled) { setYearLoading(false); setLoading(false); } });
    return () => { cancelled = true; };
  }, [year]);

  const changeYear = (y: string) => { setYear(y); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const yearIdx = years.findIndex(y => y.year === year);
  const newerYear = yearIdx > 0 ? years[yearIdx - 1].year : null;
  const olderYear = yearIdx >= 0 && yearIdx < years.length - 1 ? years[yearIdx + 1].year : null;

  // Group by year → month
  const grouped: Grouped = {};
  for (const e of entries) {
    const year  = getYear(e.watched_date);
    const month = getMonthName(e.watched_date);
    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push(e);
  }

  const groupedYears = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
  const MONTHS_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 animate-pulse space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <div className="h-7 w-16 bg-[#e8dcc8] rounded mb-4" />
            <div className="space-y-3 pl-6">
              <div className="h-4 w-20 bg-[#e8dcc8] rounded" />
              <div className="h-16 bg-[#e8dcc8] rounded-xl" />
              <div className="h-16 bg-[#e8dcc8] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-[#3d2b1f]">Our Timeline</h1>
        <p className="handwriting text-rose-400 text-lg mt-1">a journey through every movie night 📅</p>
      </motion.div>

      {years.length > 0 && (
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => newerYear && changeYear(newerYear)}
            disabled={!newerYear}
            aria-label="Newer year"
            className="p-2 rounded-xl border border-[#e8dcc8] bg-white text-[#7a5c47] hover:bg-rose-50 hover:border-rose-300 transition disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#e8dcc8]"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 flex gap-1.5 overflow-x-auto justify-center flex-wrap">
            {years.map(y => (
              <button
                key={y.year}
                onClick={() => changeYear(y.year)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  y.year === year
                    ? "bg-rose-100 border-rose-300 text-rose-700 font-medium"
                    : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                }`}
              >
                {y.year}
              </button>
            ))}
          </div>
          <button
            onClick={() => olderYear && changeYear(olderYear)}
            disabled={!olderYear}
            aria-label="Older year"
            className="p-2 rounded-xl border border-[#e8dcc8] bg-white text-[#7a5c47] hover:bg-rose-50 hover:border-rose-300 transition disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#e8dcc8]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {yearLoading ? (
        <p className="text-center py-16 handwriting text-rose-400 text-lg animate-pulse">turning the page… 💕</p>
      ) : groupedYears.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📅</p>
          <p className="font-display text-xl text-[#3d2b1f]">No entries yet</p>
          <Link href="/add" className="inline-block mt-4 px-5 py-2.5 bg-rose-400 text-white rounded-xl text-sm font-medium hover:bg-rose-500 transition-colors">
            Add First Entry 💕
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedYears.map((year, yi) => (
            <motion.div
              key={year}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: yi * 0.1 }}
            >
              {/* Year header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="font-display text-4xl font-bold text-[#3d2b1f] leading-none">{year}</div>
                <div className="flex-1 h-px bg-gradient-to-r from-[#e8dcc8] to-transparent" />
                <span className="text-xs text-[#9e7a60]">
                  {Object.values(grouped[year]).reduce((s, a) => s + a.length, 0)} films
                </span>
              </div>

              {/* Months */}
              <div className="space-y-6">
                {[...MONTHS_ORDER].reverse()
                  .filter(m => grouped[year][m])
                  .map((month, mi) => (
                    <div key={month}>
                      {/* Month label */}
                      <div className="flex items-center gap-2 mb-3 pl-2">
                        <div className="w-2 h-2 rounded-full bg-rose-300" />
                        <h3 className="text-sm font-semibold text-[#7a5c47] uppercase tracking-wide">{month}</h3>
                        <span className="text-xs text-[#b8a090]">{grouped[year][month].length} film{grouped[year][month].length !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Entries for this month */}
                      <div className="pl-6 space-y-2.5 border-l-2 border-[#f0e6d2]">
                        {grouped[year][month].map((entry, ei) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: yi * 0.1 + mi * 0.05 + ei * 0.03 }}
                          >
                            <Link href={`/entries/${entry.id}`} className="block">
                              <div className="diary-card flex items-center gap-3 px-4 py-3">
                                {entry.poster_url && (
                                  <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 shadow-sm">
                                    <Image
                                      src={entry.poster_url}
                                      alt={entry.title ?? ""}
                                      width={40}
                                      height={56}
                                      className="w-full h-full object-cover"
                                      unoptimized
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-display font-semibold text-[#3d2b1f] text-sm truncate">{entry.title}</p>
                                  <p className="text-xs text-[#9e7a60]">{formatShortDate(entry.watched_date)}</p>
                                </div>
                                {entry.your_rating && (
                                  <span className="text-xs text-amber-500 font-medium flex-shrink-0">
                                    ★ {entry.your_rating}<span className="text-[#b8a090]"> /10</span>
                                  </span>
                                )}
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          ))}
          {olderYear && (
            <button
              onClick={() => changeYear(olderYear)}
              className="w-full py-3 rounded-xl border border-[#e8dcc8] bg-white text-sm text-[#7a5c47] hover:bg-rose-50 hover:border-rose-300 transition flex items-center justify-center gap-1.5"
            >
              <span className="handwriting text-rose-400 text-lg">back to {olderYear}</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
