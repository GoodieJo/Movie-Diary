"use client";
import { cn } from "@/lib/utils";
import type { MoodBefore, MoodAfter } from "@/types";
import { MOODS_BEFORE, MOODS_AFTER } from "@/types";
import { moodEmoji } from "@/lib/utils";

interface MoodPickerProps<T extends string> {
  options: T[];
  value?: T;
  onChange: (v: T) => void;
  label?: string;
}

export function MoodPicker<T extends string>({ options, value, onChange, label }: MoodPickerProps<T>) {
  return (
    <div>
      {label && <p className="text-sm font-medium text-[#3d2b1f] mb-2">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => onChange(mood)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all",
              value === mood
                ? "bg-rose-100 border-rose-300 text-rose-700 font-medium shadow-sm"
                : "bg-white border-[#e8dcc8] text-[#7a5c47] hover:border-rose-200 hover:bg-rose-50"
            )}
          >
            <span>{moodEmoji(mood)}</span>
            {mood}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MoodBeforePicker({ value, onChange }: { value?: MoodBefore; onChange: (v: MoodBefore) => void }) {
  return <MoodPicker options={MOODS_BEFORE} value={value} onChange={onChange} label="Mood before the movie" />;
}

export function MoodAfterPicker({ value, onChange }: { value?: MoodAfter; onChange: (v: MoodAfter) => void }) {
  return <MoodPicker options={MOODS_AFTER} value={value} onChange={onChange} label="Mood after the movie" />;
}
