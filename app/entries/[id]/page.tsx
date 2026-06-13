"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Trash2 } from "lucide-react";
import type { DiaryEntry } from "@/types";
import { formatDate, moodEmoji, locationEmoji } from "@/lib/utils";
import { AverageRating, StarRating } from "@/components/diary/StarRating";
import { toast } from "@/hooks/use-toast";


function MemoryBlock({ label, text, emoji }: { label: string; text?: string | null; emoji: string }) {
  if (!text) return null;
  return (
    <div className="bg-[#fdf5e8] border border-[#e8dcc8] rounded-xl p-4 relative">
      <span className="absolute -top-3 left-4 text-xl">{emoji}</span>
      <p className="text-xs font-medium text-[#9e7a60] mb-1 mt-1">{label}</p>
      <p className="text-sm text-[#3d2b1f] leading-relaxed italic">&ldquo;{text}&rdquo;</p>
    </div>
  );
}

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/entries/${id}`)
      .then(r => r.ok ? r.json() as Promise<{ data: DiaryEntry }> : null)
      .then(d => setEntry(d?.data ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this memory? This can't be undone.")) return;
    setDeleting(true);
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    toast({ title: "Entry deleted", description: "Memory removed from your diary." });
    router.push("/entries");
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 w-24 bg-[#e8dcc8] rounded" />
        <div className="h-64 bg-[#e8dcc8] rounded-2xl" />
        <div className="h-32 bg-[#e8dcc8] rounded-2xl" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🎞️</p>
        <p className="font-display text-xl text-[#3d2b1f]">Entry not found</p>
        <Link href="/entries" className="text-rose-400 text-sm mt-2 block hover:underline">← Back to diary</Link>
      </div>
    );
  }

  const avgRating = entry.your_rating && entry.partner_rating
    ? (entry.your_rating + entry.partner_rating) / 2
    : (entry.your_rating ?? entry.partner_rating ?? null);

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/entries" className="inline-flex items-center gap-1.5 text-sm text-[#9e7a60] hover:text-[#3d2b1f] mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to diary
      </Link>

      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="diary-card overflow-hidden mb-5"
      >
        {/* Poster + title banner */}
        <div className="flex gap-5 p-5 bg-gradient-to-br from-[#fdf5e8] to-[#fff0f3]">
          {entry.poster_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex-shrink-0 w-24 shadow-lift rounded-xl overflow-hidden"
            >
              <Image
                src={entry.poster_url}
                alt={entry.title ?? ""}
                width={96}
                height={144}
                className="w-full h-full object-cover"
                unoptimized
              />
            </motion.div>
          )}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="font-display text-2xl font-bold text-[#3d2b1f] leading-tight">{entry.title}</h1>
            <p className="text-sm text-[#9e7a60] mt-1 flex items-center gap-1">
              📅 {formatDate(entry.watched_date)}
            </p>
            {entry.genre && (
              <span className="inline-block mt-2 text-xs bg-white border border-[#e8dcc8] px-2.5 py-1 rounded-full text-[#7a5c47]">
                {entry.genre}
              </span>
            )}
            {entry.runtime && (
              <p className="text-xs text-[#b8a090] mt-1.5 flex items-center gap-1">
                <Clock size={11} /> {Math.floor(entry.runtime / 60)}h {entry.runtime % 60}m
              </p>
            )}
            {avgRating && (
              <div className="mt-2">
                <AverageRating your={entry.your_rating} partner={entry.partner_rating} />
              </div>
            )}
          </div>
        </div>

        {/* Quick meta strip */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-[#f0e6d2] text-sm flex-wrap">
          {entry.location && (
            <span className="flex items-center gap-1 text-[#7a5c47]">
              {locationEmoji(entry.location)} {entry.location}
            </span>
          )}
          {entry.start_time && entry.end_time && (
            <span className="flex items-center gap-1 text-[#7a5c47]">
              <Clock size={13} /> {entry.start_time} – {entry.end_time}
            </span>
          )}
          {entry.snacks && (
            <span className="flex items-center gap-1 text-[#7a5c47]">
              🍿 {entry.snacks}
            </span>
          )}
        </div>
      </motion.div>

      {/* Ratings detail */}
      {(entry.your_rating || entry.partner_rating) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="diary-card p-5 mb-5"
        >
          <h2 className="font-display font-semibold text-[#3d2b1f] mb-4">⭐ Ratings</h2>
          <div className="grid grid-cols-2 gap-4">
            {entry.your_rating && (
              <div>
                <p className="text-xs text-[#9e7a60] mb-1">Your rating</p>
                <StarRating value={entry.your_rating} readonly />
              </div>
            )}
            {entry.partner_rating && (
              <div>
                <p className="text-xs text-[#9e7a60] mb-1">Partner&apos;s rating</p>
                <StarRating value={entry.partner_rating} readonly />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Mood */}
      {(entry.mood_before || entry.mood_after) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="diary-card p-5 mb-5"
        >
          <h2 className="font-display font-semibold text-[#3d2b1f] mb-3">Mood Journey</h2>
          <div className="flex items-center justify-center gap-4 text-center">
            {entry.mood_before && (
              <div>
                <div className="text-3xl">{moodEmoji(entry.mood_before)}</div>
                <p className="text-xs text-[#9e7a60] mt-1">Before</p>
                <p className="text-sm font-medium text-[#3d2b1f]">{entry.mood_before}</p>
              </div>
            )}
            {entry.mood_before && entry.mood_after && (
              <div className="text-[#c99f7f] text-xl">→</div>
            )}
            {entry.mood_after && (
              <div>
                <div className="text-3xl">{moodEmoji(entry.mood_after)}</div>
                <p className="text-xs text-[#9e7a60] mt-1">After</p>
                <p className="text-sm font-medium text-[#3d2b1f]">{entry.mood_after}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Memories */}
      {(entry.favorite_scene || entry.favorite_character || entry.best_quote || entry.laugh_memory || entry.cry_memory || entry.special_memory) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="diary-card p-5 mb-5 space-y-4"
        >
          <h2 className="font-display font-semibold text-[#3d2b1f]">💭 Our Memories</h2>

          {entry.favorite_scene && (
            <div className="text-sm">
              <p className="text-xs text-[#9e7a60] font-medium uppercase tracking-wide mb-0.5">Favorite Scene</p>
              <p className="text-[#3d2b1f]">{entry.favorite_scene}</p>
            </div>
          )}
          {entry.favorite_character && (
            <div className="text-sm">
              <p className="text-xs text-[#9e7a60] font-medium uppercase tracking-wide mb-0.5">Favorite Character</p>
              <p className="text-[#3d2b1f]">{entry.favorite_character}</p>
            </div>
          )}
          {entry.best_quote && (
            <div className="bg-rose-50 border-l-2 border-rose-300 pl-3 py-2 rounded-r-lg">
              <p className="text-xs text-[#9e7a60] mb-0.5">Best Quote</p>
              <p className="text-sm text-[#3d2b1f] italic">&ldquo;{entry.best_quote}&rdquo;</p>
            </div>
          )}

          <MemoryBlock label="What made us laugh" text={entry.laugh_memory} emoji="😂" />
          <MemoryBlock label="What made us cry" text={entry.cry_memory} emoji="😢" />

          {entry.special_memory && (
            <div className="bg-gradient-to-br from-[#fdf5e8] to-[#fff0f3] border border-[#f5d0d8] rounded-xl p-4 relative">
              <span className="absolute -top-3 left-4 text-xl">💕</span>
              <p className="text-xs font-medium text-rose-400 mb-2 mt-1 font-semibold">Special Memory</p>
              <p className="handwriting text-[#3d2b1f] text-base leading-relaxed">{entry.special_memory}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Photos */}
      {entry.photos && entry.photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="diary-card p-5 mb-5"
        >
          <h2 className="font-display font-semibold text-[#3d2b1f] mb-3">📸 Photos</h2>
          <div className="grid grid-cols-3 gap-2">
            {entry.photos.map(photo => (
              <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-[#f0e6d2] shadow-sm">
                <Image src={photo.url} alt={photo.label ?? "Photo"} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm border border-red-200 transition-colors"
        >
          <Trash2 size={14} />
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
