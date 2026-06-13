"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { StarRating } from "@/components/diary/StarRating";
import { MoodBeforePicker, MoodAfterPicker } from "@/components/diary/MoodPicker";
import { WATCH_LOCATIONS } from "@/types";
import { toast } from "@/hooks/use-toast";
import type { DiaryEntry, MoodBefore, MoodAfter } from "@/types";
import Link from "next/link";

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition ${className}`}
    />
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2.5 bg-white border border-[#e8dcc8] rounded-xl text-sm text-[#3d2b1f] placeholder:text-[#b8a090] focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition resize-none ${className}`}
    />
  );
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#3d2b1f]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[#b8a090]">{hint}</p>}
    </div>
  );
}

export default function EditEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [entry, setEntry]     = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const { register, control, reset, watch, getValues } = useForm();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/entries/${id}`)
      .then(r => r.json() as Promise<{ data: DiaryEntry }>)
      .then(d => {
        setEntry(d.data);
        reset({
          watched_date:       d.data.watched_date ?? "",
          start_time:         d.data.start_time ?? "",
          end_time:           d.data.end_time ?? "",
          your_rating:        d.data.your_rating ?? null,
          partner_rating:     d.data.partner_rating ?? null,
          favorite_scene:     d.data.favorite_scene ?? "",
          favorite_character: d.data.favorite_character ?? "",
          best_quote:         d.data.best_quote ?? "",
          laugh_memory:       d.data.laugh_memory ?? "",
          cry_memory:         d.data.cry_memory ?? "",
          special_memory:     d.data.special_memory ?? "",
          mood_before:        d.data.mood_before ?? "",
          mood_after:         d.data.mood_after ?? "",
          location:           d.data.location ?? "Home",
          snacks:             d.data.snacks ?? "",
          poster_url:         d.data.poster_url ?? "",
          genre:              d.data.genre ?? "",
          runtime:            d.data.runtime ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [id, reset]);

  async function handleSave() {
    setSaving(true);
    try {
      const values = getValues();
      const res = await fetch(`/api/entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Saved! 💕", description: "Your memory has been updated." });
      router.push(`/entries/${id}`);
    } catch (e) {
      toast({ title: "Save failed", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const watchedPoster = watch("poster_url");

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 w-24 bg-[#e8dcc8] rounded" />
        <div className="h-64 bg-[#e8dcc8] rounded-2xl" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-xl text-[#3d2b1f]">Entry not found</p>
        <Link href="/entries" className="text-rose-400 text-sm mt-2 block">← Back to diary</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <Link href={`/entries/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[#9e7a60] hover:text-[#3d2b1f] transition-colors">
        <ArrowLeft size={15} /> Back to entry
      </Link>

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-display text-2xl font-bold text-[#3d2b1f]">Edit Memory</h1>
        <p className="handwriting text-rose-400 text-lg mt-1">{entry.title} ✏️</p>
      </motion.div>

      {/* Movie info (read-only) */}
      <div className="diary-card p-5 space-y-4">
        <h2 className="font-display font-semibold text-[#3d2b1f]">🎬 Movie Info</h2>

        <div className="flex gap-4 items-start">
          {watchedPoster && (
            <Image
              src={watchedPoster as string}
              alt="Poster"
              width={64}
              height={96}
              className="rounded-lg shadow-sm object-cover flex-shrink-0"
              unoptimized
            />
          )}
          <div className="flex-1 space-y-3">
            <FormField label="Movie Title">
              <p className="text-sm font-medium text-[#3d2b1f] py-2">{entry.title}</p>
            </FormField>
            <FormField label="Poster URL" hint="Paste any image URL">
              <Input {...register("poster_url")} placeholder="https://..." />
            </FormField>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Genre">
            <Input {...register("genre")} placeholder="Drama…" />
          </FormField>
          <FormField label="Runtime (min)">
            <Input type="number" {...register("runtime")} placeholder="120" />
          </FormField>
        </div>
      </div>

      {/* Date & Location */}
      <div className="diary-card p-5 space-y-4">
        <h2 className="font-display font-semibold text-[#3d2b1f]">📅 When & Where</h2>

        <FormField label="Date Watched">
          <Input type="date" {...register("watched_date")} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Time">
            <Input type="time" {...register("start_time")} />
          </FormField>
          <FormField label="End Time">
            <Input type="time" {...register("end_time")} />
          </FormField>
        </div>

        <FormField label="Where?">
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {WATCH_LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => field.onChange(loc)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      field.value === loc
                        ? "bg-rose-100 border-rose-300 text-rose-700 font-medium"
                        : "bg-white border-[#e8dcc8] text-[#7a5c47] hover:border-rose-200"
                    }`}
                  >
                    {loc === "Home" ? "🏠" : loc === "Cinema" ? "🎬" : loc === "Online Date" ? "💻" : loc === "Vacation" ? "✈️" : "📍"} {loc}
                  </button>
                ))}
              </div>
            )}
          />
        </FormField>

        <FormField label="Snacks 🍿">
          <Input {...register("snacks")} placeholder="Popcorn, wine…" />
        </FormField>
      </div>

      {/* Ratings */}
      <div className="diary-card p-5 space-y-5">
        <h2 className="font-display font-semibold text-[#3d2b1f]">⭐ Ratings</h2>
        <Controller
          control={control}
          name="your_rating"
          render={({ field }) => (
            <FormField label="Your Rating">
              <StarRating value={field.value as number} onChange={field.onChange} size="lg" />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="partner_rating"
          render={({ field }) => (
            <FormField label="Partner&apos;s Rating">
              <StarRating value={field.value as number} onChange={field.onChange} size="lg" />
            </FormField>
          )}
        />
      </div>

      {/* Memories */}
      <div className="diary-card p-5 space-y-4">
        <h2 className="font-display font-semibold text-[#3d2b1f]">💭 Memories</h2>
        <FormField label="Favorite Scene">
          <Input {...register("favorite_scene")} placeholder="That moment when…" />
        </FormField>
        <FormField label="Favorite Character">
          <Input {...register("favorite_character")} placeholder="Who stole the show?" />
        </FormField>
        <FormField label="Best Quote">
          <Input {...register("best_quote")} placeholder="The line you can't forget…" />
        </FormField>
        <FormField label="What made you laugh? 😂">
          <Textarea {...register("laugh_memory")} rows={2} />
        </FormField>
        <FormField label="What made you cry? 😢">
          <Textarea {...register("cry_memory")} rows={2} />
        </FormField>
        <FormField label="Special Memory 💕">
          <Textarea {...register("special_memory")} rows={4} className="diary-lines" />
        </FormField>
      </div>

      {/* Mood */}
      <div className="diary-card p-5 space-y-5">
        <h2 className="font-display font-semibold text-[#3d2b1f]">😊 Mood</h2>
        <Controller
          control={control}
          name="mood_before"
          render={({ field }) => (
            <MoodBeforePicker value={field.value as MoodBefore} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="mood_after"
          render={({ field }) => (
            <MoodAfterPicker value={field.value as MoodAfter} onChange={field.onChange} />
          )}
        />
      </div>

      {/* Save button */}
      <div className="flex gap-3 pb-8">
        <Link
          href={`/entries/${id}`}
          className="flex-1 text-center py-3 bg-[#f5ede4] hover:bg-[#ead8c8] text-[#3d2b1f] rounded-xl text-sm font-medium transition-colors border border-[#e8dcc8]"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save Changes 💕"}
        </button>
      </div>
    </div>
  );
}