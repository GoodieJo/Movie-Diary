"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { DiaryEntry } from "@/types";
import { formatShortDate, moodEmoji, locationEmoji } from "@/lib/utils";
import { AverageRating } from "./StarRating";

export function EntryCard({ entry, index = 0 }: { entry: DiaryEntry; index?: number }) {
  const poster = entry.poster_url ?? "/placeholder-poster.svg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -3 }}
    >
      <Link href={`/entries/${entry.id}`} className="block">
        <div className="diary-card relative overflow-hidden flex gap-4 p-4">
          {/* Poster */}
          <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-[#f0e6d2] shadow-sm">
            <Image
              src={poster}
              alt={entry.title ?? "Movie poster"}
              width={64}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-[#3d2b1f] text-base leading-tight truncate">
              {entry.title}
            </h3>

            <p className="text-xs text-[#9e7a60] mt-0.5 flex items-center gap-1">
              <span>📅</span>
              {formatShortDate(entry.watched_date)}
            </p>

            {(entry.your_rating || entry.partner_rating) && (
              <div className="mt-1.5">
                <AverageRating your={entry.your_rating} partner={entry.partner_rating} />
              </div>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {entry.genre && (
                <span className="text-xs bg-[#faf0d7] text-[#7a5c47] px-2 py-0.5 rounded-full border border-[#e8dcc8]">
                  {entry.genre}
                </span>
              )}
              {entry.location && (
                <span className="text-xs text-[#9e7a60] flex items-center gap-0.5">
                  {locationEmoji(entry.location)} {entry.location}
                </span>
              )}
              {entry.mood_after && (
                <span className="text-xs">{moodEmoji(entry.mood_after)} {entry.mood_after}</span>
              )}
            </div>

            {entry.special_memory && (
              <p className="handwriting text-rose-400 text-sm mt-2 line-clamp-1 italic">
                &ldquo;{entry.special_memory}&rdquo;
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
