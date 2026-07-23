"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Film, Heart, Camera, Smile } from "lucide-react";
import { StarRating } from "@/components/diary/StarRating";
import { MoodBeforePicker, MoodAfterPicker } from "@/components/diary/MoodPicker";
import { PhotoUpload } from "@/components/diary/PhotoUpload";
import { WATCH_LOCATIONS } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useSettings } from "@/components/album/useSettings";
import type { MoodBefore, MoodAfter } from "@/types";

const AUTHOR_KEY = "album_last_author";

const schema = z.object({
  added_by:           z.enum(["1", "2"]),
  title:              z.string().min(1, "Movie title is required"),
  watched_date:       z.string().min(1, "Date is required"),
  poster_url:         z.string().optional(),
  genre:              z.string().optional(),
  runtime:            z.preprocess((v) => (v === null || v === "" ? undefined : v), z.number().optional()),
  overview:           z.string().optional(),
  start_time:         z.string().optional(),
  end_time:           z.string().optional(),
  your_rating:        z.preprocess((v) => (v === null || v === "" ? undefined : v), z.number().min(1).max(10).optional()),
  partner_rating:     z.preprocess((v) => (v === null || v === "" ? undefined : v), z.number().min(1).max(10).optional()),
  favorite_scene:     z.string().optional(),
  favorite_character: z.string().optional(),
  best_quote:         z.string().optional(),
  laugh_memory:       z.string().optional(),
  cry_memory:         z.string().optional(),
  special_memory:     z.string().optional(),
  mood_before:        z.string().optional(),
  mood_after:         z.string().optional(),
  location:           z.string().optional(),
  snacks:             z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: "movie",   label: "Movie",   icon: Film,   emoji: "🎬" },
  { id: "ratings", label: "Ratings", icon: Heart,  emoji: "⭐" },
  { id: "memory",  label: "Memory",  icon: Heart,  emoji: "💭" },
  { id: "mood",    label: "Mood",    icon: Smile,  emoji: "😊" },
  { id: "photos",  label: "Photos",  icon: Camera, emoji: "📸" },
];

function FormField({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#3d2b1f]">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[#b8a090]">{hint}</p>}
    </div>
  );
}

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

export default function AddEntryPage() {
  return (
    <Suspense fallback={null}>
      <AddEntryForm />
    </Suspense>
  );
}

function AddEntryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wishlistId = searchParams.get("wishlist_id");
  const [step, setStep] = useState(0);
  const { settings } = useSettings();

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const { register, control, setValue, watch, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      added_by: typeof window !== "undefined" && localStorage.getItem(AUTHOR_KEY) === "2" ? "2" : "1",
      title: searchParams.get("title") ?? "",
      poster_url: searchParams.get("poster_url") ?? undefined,
      runtime: searchParams.get("runtime") ? Number(searchParams.get("runtime")) : undefined,
      watched_date: new Date().toISOString().split("T")[0],
      location: "Home",
    },
  });

  const watchedTitle   = watch("title");
  const watchedPoster  = watch("poster_url");

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: unknown };
        throw new Error(JSON.stringify(errData.error));
      }

      const { data: entry } = await res.json() as { data: { id: number } };

// Save uploaded photos linked to this entry
if (photoUrls.length > 0) {
  await Promise.all(photoUrls.map(url =>
    fetch("/api/upload", {
      method: "POST",
      body: (() => {
        const fd = new FormData();
        fd.append("entry_id", String(entry.id));
        fd.append("existing_url", url);
        return fd;
      })(),
    })
  ));
}

if (wishlistId) {
  await fetch(`/api/wishlist/${wishlistId}`, { method: "DELETE" }).catch(() => {});
}

toast({ title: "Memory saved! 💕", description: `"${data.title}" added to your diary.` });
router.push(`/entries/${entry.id}`);
    } catch (e) {
      console.error("Save failed:", e);
      toast({ title: "Couldn't save", description: String(e), variant: "destructive" });
    }
  }

  const canNext = step === 0 ? !!watchedTitle : true;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-[#3d2b1f]">New Diary Entry</h1>
        <p className="handwriting text-rose-400 text-lg mt-1">add a new memory together 💕</p>
      </motion.div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === step
                ? "bg-rose-400 text-white shadow-sm"
                : i < step
                ? "bg-rose-100 text-rose-600 cursor-pointer"
                : "bg-[#f0e6d2] text-[#b8a090] cursor-default"
            }`}
          >
            <span>{s.emoji}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* STEP 0 — Movie Details */}
        {step === 0 && (
          <motion.div key="movie" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
            <div className="diary-card p-5 space-y-5">
              <h2 className="font-display text-xl font-semibold text-[#3d2b1f]">🎬 Movie Details</h2>

              <FormField label="Who's adding this?">
                <Controller
                  control={control}
                  name="added_by"
                  render={({ field }) => (
                    <div className="flex gap-2">
                      {(["1", "2"] as const).map(a => {
                        const name  = a === "1" ? settings.person1_name  : settings.person2_name;
                        const emoji = a === "1" ? settings.person1_emoji : settings.person2_emoji;
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => {
                              field.onChange(a);
                              localStorage.setItem(AUTHOR_KEY, a);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              field.value === a
                                ? a === "1"
                                  ? "bg-blue-50 border-blue-300 text-blue-700"
                                  : "bg-rose-50 border-rose-300 text-rose-600"
                                : "bg-white border-[#e8dcc8] text-[#7a5c47]"
                            }`}
                          >
                            <span>{emoji}</span> {name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </FormField>

              <FormField label="Movie Title" required>
                <Input {...register("title")} placeholder="e.g. Interstellar" />
                {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
              </FormField>

              <FormField label="Movie Poster URL" hint="Paste an image URL — e.g. from Google Images or IMDB">
                <Input
                  {...register("poster_url")}
                  placeholder="https://image.tmdb.org/t/p/w500/..."
                />
              </FormField>

              {watchedPoster && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 p-3 bg-[#fdf5e8] rounded-xl border border-[#e8dcc8]">
                  <Image
                    src={watchedPoster}
                    alt="Poster preview"
                    width={60}
                    height={90}
                    className="rounded-lg shadow-sm object-cover"
                    unoptimized
                  />
                  <div className="flex-1 min-w-0 flex items-center">
                    <p className="font-medium text-[#3d2b1f] text-sm">{watchedTitle}</p>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Genre">
                  <Input {...register("genre")} placeholder="Drama, Romance…" />
                </FormField>
                <FormField label="Runtime (min)">
                  <Input
                    type="number"
                    {...register("runtime", { valueAsNumber: true })}
                    placeholder="120"
                  />
                </FormField>
              </div>

              <FormField label="Date Watched" required>
                <Input type="date" {...register("watched_date")} />
                {errors.watched_date && <p className="text-xs text-rose-500 mt-1">{errors.watched_date.message}</p>}
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Start Time">
                  <Input type="time" {...register("start_time")} />
                </FormField>
                <FormField label="End Time">
                  <Input type="time" {...register("end_time")} />
                </FormField>
              </div>

              <FormField label="Where did you watch?">
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

              <FormField label="Snacks 🍿" hint="What did you munch on?">
                <Input {...register("snacks")} placeholder="Popcorn, hot chocolate, leftover pizza…" />
              </FormField>
            </div>
          </motion.div>
        )}

        {/* STEP 1 — Ratings */}
        {step === 1 && (
          <motion.div key="ratings" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
            <div className="diary-card p-5 space-y-6">
              <h2 className="font-display text-xl font-semibold text-[#3d2b1f]">⭐ Your Ratings</h2>

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

              {(watch("your_rating") || watch("partner_rating")) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-[#3d2b1f]">Average rating</p>
                  <p className="text-3xl font-bold text-rose-400 mt-0.5">
                    {(() => {
                      const y = (watch("your_rating") as number) ?? 0;
                      const p = (watch("partner_rating") as number) ?? 0;
                      const avg = y && p ? (y + p) / 2 : y || p;
                      return avg.toFixed(1);
                    })()}
                    <span className="text-xl ml-1">/ 5</span>
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2 — Memory */}
        {step === 2 && (
          <motion.div key="memory" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
            <div className="diary-card p-5 space-y-5">
              <h2 className="font-display text-xl font-semibold text-[#3d2b1f]">💭 Memories</h2>

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
                <Textarea {...register("laugh_memory")} rows={2} placeholder="The scene where…" />
              </FormField>
              <FormField label="What made you cry? 😢">
                <Textarea {...register("cry_memory")} rows={2} placeholder="Okay maybe just a little…" />
              </FormField>
              <FormField label="Special Memory 💕" hint="The real diary entry — be as personal as you like">
                <Textarea
                  {...register("special_memory")}
                  rows={4}
                  placeholder="You fell asleep during the first half and then cried during the ending…"
                  className="diary-lines"
                />
              </FormField>
            </div>
          </motion.div>
        )}

        {/* STEP 3 — Mood */}
        {step === 3 && (
          <motion.div key="mood" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
            <div className="diary-card p-5 space-y-6">
              <h2 className="font-display text-xl font-semibold text-[#3d2b1f]">😊 Mood Tracking</h2>
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
          </motion.div>
        )}

        {/* STEP 4 — Photos */}
        {step === 4 && (
          <motion.div key="photos" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
            <div className="diary-card p-5 space-y-5">
              <h2 className="font-display text-xl font-semibold text-[#3d2b1f]">📸 Photos</h2>
              <p className="text-sm text-[#9e7a60]">Add couple selfies, snacks, tickets — whatever captures the night!</p>
              <PhotoUpload onChange={setPhotoUrls} />
            </div>

            <div className="diary-card p-5 bg-[#fdf5e8]">
              <h3 className="font-display font-semibold text-[#3d2b1f] mb-3">Ready to save? ✨</h3>
              <div className="space-y-1 text-sm text-[#7a5c47]">
                <p>🎬 <strong>{watchedTitle || "No movie yet"}</strong></p>
                {watch("watched_date") && <p>📅 {watch("watched_date")}</p>}
                {watch("your_rating") && <p>⭐ Your rating: {watch("your_rating") as number}/5</p>}
                {watch("partner_rating") && <p>⭐ Partner: {watch("partner_rating") as number}/5</p>}
                {watch("location") && <p>📍 {watch("location")}</p>}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f5ede4] hover:bg-[#ead8c8] text-[#3d2b1f] rounded-xl text-sm font-medium transition-colors border border-[#e8dcc8]"
        >
          <ChevronLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => canNext && setStep(s => s + 1)}
            disabled={!canNext}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSubmit(getValues() as FormData)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            💕 Save Memory
          </button>
        )}
      </div>
    </div>
  );
}