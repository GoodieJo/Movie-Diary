"use client";
import { motion } from "framer-motion";
import { Star, Trash2 } from "lucide-react";
import type { AlbumPhoto } from "./types";
import { formatShortDate } from "@/lib/utils";

// Fixed rotations per index to avoid SSR/client mismatch
const ROTATIONS = [-2.1, 1.8, -1.2, 2.4, -0.8, 1.5, -2.7, 0.9, -1.6, 2.1,
                    -0.5, 1.3, -2.3, 0.7, -1.9, 2.8, -0.3, 1.1, -2.5, 1.7];

interface Props {
  photo:   AlbumPhoto;
  index:   number;
  onClick: () => void;
  onDelete:         () => void;
  onToggleFavorite: () => void;
}

export function PolaroidCard({ photo, index, onClick, onDelete, onToggleFavorite }: Props) {
  const rotation = ROTATIONS[index % ROTATIONS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{ opacity: 1, y: 0,  rotate: rotation }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.4 }}
      whileHover={{ y: -6, rotate: 0, scale: 1.02, boxShadow: "0 20px 40px -10px rgba(61,43,31,0.25)" }}
      className="bg-white rounded-sm cursor-pointer group relative"
      style={{
        padding: "10px 10px 40px 10px",
        boxShadow: "0 4px 15px -3px rgba(61,43,31,0.18), 0 2px 6px -2px rgba(61,43,31,0.1)",
      }}
      onClick={onClick}
    >
      {/* Favorite star badge */}
      {photo.favorite === 1 && (
        <div className="absolute -top-2 -right-2 z-10 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
          <Star size={13} className="fill-white text-white" />
        </div>
      )}

      {/* Photo */}
      <div className="overflow-hidden bg-[#f0e6d2] aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.image_url}
          alt={photo.caption ?? "Memory"}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = "/placeholder-poster.svg"; }}
        />
      </div>

      {/* Caption area */}
      <div className="pt-2 px-0.5">
        {photo.caption ? (
          <p className="handwriting text-[#3d2b1f] text-sm leading-tight line-clamp-2">
            {photo.caption}
          </p>
        ) : (
          <p className="handwriting text-[#c9b89a] text-sm italic">a little moment ✨</p>
        )}
        {photo.taken_date && (
          <p className="text-[10px] text-[#b8a090] mt-0.5">{formatShortDate(photo.taken_date)}</p>
        )}
      </div>

      {/* Action buttons — show on hover */}
      <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          aria-label="Toggle favorite"
          className="w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-amber-50 transition-colors"
        >
          <Star
            size={11}
            className={photo.favorite ? "fill-amber-400 text-amber-400" : "text-[#c9b89a]"}
          />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete photo"
          className="w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-red-50 transition-colors"
        >
          <Trash2 size={11} className="text-rose-400" />
        </button>
      </div>
    </motion.div>
  );
}
