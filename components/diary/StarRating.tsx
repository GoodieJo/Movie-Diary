"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  max?: number;
}

export function StarRating({ value = 0, onChange, readonly = false, size = "md", max = 10 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizes = { sm: "text-sm", md: "text-xl", lg: "text-2xl" };

  return (
    <div className={cn("flex gap-0.5 flex-wrap", readonly ? "" : "cursor-pointer")}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = star <= (readonly ? value : (hovered || value));
        return (
          <span
            key={star}
            className={cn(sizes[size], "transition-transform", !readonly && "hover:scale-110 active:scale-95")}
            style={{ color: filled ? "#e3a857" : "#d4c4aa" }}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(star)}
          >
            {filled ? "★" : "☆"}
          </span>
        );
      })}
    </div>
  );
}

export function AverageRating({ your, partner, max = 10 }: { your?: number | null; partner?: number | null; max?: number }) {
  if (!your && !partner) return null;
  const avg = your && partner ? (your + partner) / 2 : (your ?? partner ?? 0);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-amber-500 font-semibold">{avg.toFixed(1)}</span>
      <span className="text-[#9e7a60]">/ {max}</span>
      {your && partner && (
        <span className="text-xs text-[#b8a090]">
          (You: {your} · Partner: {partner})
        </span>
      )}
    </div>
  );
}