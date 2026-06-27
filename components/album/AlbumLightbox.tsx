"use client";

import { useState } from "react";
import { CommentPanel } from "./CommentPanel";
import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Star, MessageCircle } from "lucide-react";
import type { AlbumPhoto } from "./types";
import { formatShortDate } from "@/lib/utils";

interface Props {
  photos:   AlbumPhoto[];
  index:    number;
  onClose:  () => void;
  onChange: (i: number) => void;
  onToggleFavorite: (photo: AlbumPhoto) => void;
}

export function AlbumLightbox({ photos, index, onClose, onChange, onToggleFavorite }: Props) {
  const photo = photos[index];
  const [showComments, setShowComments] = useState(false);
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  const prev = useCallback(() => { if (hasPrev) onChange(index - 1); }, [hasPrev, index, onChange]);
  const next = useCallback(() => { if (hasNext) onChange(index + 1); }, [hasNext, index, onChange]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   prev();
      if (e.key === "ArrowRight")  next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  // Touch/swipe
  useEffect(() => {
    let startX = 0;
    function onTouchStart(e: TouchEvent) { startX = e.touches[0].clientX; }
    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -50)  next();
      if (dx >  50)  prev();
    }
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend",   onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, [prev, next]);

  if (!photo) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
      >
        {/* Blurred backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X size={22} />
        </button>

        {/* Favorite toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(photo); }}
          aria-label={photo.favorite ? "Remove from favorites" : "Add to favorites"}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <Star
            size={20}
            className={photo.favorite ? "fill-amber-400 text-amber-400" : "text-white"}
          />
        </button>

        <button
        onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
        aria-label="View comments"
         className="absolute top-4 left-16 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
         <MessageCircle size={20} />
        </button>

        {/* Prev */}
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous photo"
            className="absolute left-3 sm:left-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Next */}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next photo"
            className="absolute right-3 sm:right-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {/* Photo */}
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 flex flex-col items-center max-w-3xl w-full mx-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.image_url}
            alt={photo.caption ?? "Memory"}
            className="max-h-[75vh] max-w-full rounded-xl shadow-2xl object-contain"
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder-poster.svg"; }}
          />

          {(photo.caption || photo.taken_date) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-4 text-center space-y-1"
            >
              {photo.caption && (
                <p className="handwriting text-white text-xl">{photo.caption}</p>
              )}
              {photo.taken_date && (
                <p className="text-white/60 text-sm">{formatShortDate(photo.taken_date)}</p>
              )}
            </motion.div>
          )}

          {/* Counter */}
          <p className="mt-3 text-white/40 text-xs">
            {index + 1} / {photos.length}
          </p>
        </motion.div>
      </motion.div>
      {showComments && (
          <CommentPanel
            photoId={photo.id}
            onClose={() => setShowComments(false)}
          />
        )}
    </AnimatePresence>
  );
}
