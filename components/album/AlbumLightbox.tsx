"use client";
import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Star, MessageCircle } from "lucide-react";
import type { AlbumPhoto } from "./types";
import { formatShortDate } from "@/lib/utils";
import { CommentPanel } from "./CommentPanel";

interface Props {
  photos:           AlbumPhoto[];
  index:            number;
  onClose:          () => void;
  onChange:         (i: number) => void;
  onToggleFavorite: (photo: AlbumPhoto) => void;
}

export function AlbumLightbox({ photos, index, onClose, onChange, onToggleFavorite }: Props) {
  const photo   = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  const [showControls, setShowControls] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch comment count when photo changes
  useEffect(() => {
    if (!photo) return;
    setCommentCount(null);
    fetch(`/api/album/${photo.id}/comments`)
      .then(r => r.json() as Promise<{ data: unknown[] }>)
      .then(d => setCommentCount((d.data ?? []).length))
      .catch(() => setCommentCount(0));
  }, [photo?.id]);

  // Auto-hide controls after 3 seconds
  function resetHideTimer() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }

  useEffect(() => {
    setShowControls(true);
    resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

function handleTap(e: React.MouseEvent) {
    // Only toggle controls when clicking backdrop or photo — not buttons
    const target = e.target as HTMLElement;
    const isInteractive = target.closest("button") || target.closest("[role='button']");
    if (isInteractive) return;
    if (showComments) return;
    setShowControls(s => {
      if (!s) resetHideTimer();
      return !s;
    });
  }

  const prev = useCallback(() => { if (hasPrev) onChange(index - 1); }, [hasPrev, index, onChange]);
  const next = useCallback(() => { if (hasNext) onChange(index + 1); }, [hasNext, index, onChange]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")     { if (showComments) setShowComments(false); else onClose(); }
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next, showComments]);

  // Touch swipe — horizontal for nav, up for comments
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx < -50) next();
        if (dx >  50) prev();
      } else {
        if (dy < -60) setShowComments(true);
      }
    }
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend",   onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, [prev, next]);

  if (!photo) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        onClick={handleTap}
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

        {/* ── Desktop controls ── */}
        {!isMobile && (
          <>
            <button
              onClick={e => { e.stopPropagation(); onToggleFavorite(photo); }}
              aria-label={photo.favorite ? "Remove from favorites" : "Add to favorites"}
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <Star size={20} className={photo.favorite ? "fill-amber-400 text-amber-400" : ""} />
            </button>

            <button
              onClick={e => { e.stopPropagation(); setShowComments(true); }}
              aria-label="View comments"
              className="absolute top-4 left-16 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-1.5"
            >
              <MessageCircle size={20} />
              {commentCount !== null && commentCount > 0 && (
                <span className="text-xs font-semibold">{commentCount}</span>
              )}
            </button>

            <button
              onClick={e => { e.stopPropagation(); onClose(); }}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={22} />
            </button>

            {hasPrev && (
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                aria-label="Previous photo"
                className="absolute left-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {hasNext && (
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                aria-label="Next photo"
                className="absolute right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </>
        )}

{/* ── Mobile bottom bar ── */}
        {isMobile && (
          <AnimatePresence>
            {showControls && (
              <motion.div
                key="mobile-controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={e => e.stopPropagation()}
                className="absolute bottom-6 left-4 right-4 z-20 flex items-center justify-around bg-black/50 backdrop-blur-sm rounded-2xl px-2 py-3"
              >
                {/* Favorite */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onToggleFavorite(photo);
                  }}
                  aria-label="Toggle favorite"
                  className="flex flex-col items-center gap-1 px-4 py-1"
                >
                  <Star
                    size={22}
                    className={photo.favorite ? "fill-amber-400 text-amber-400" : "text-white/80"}
                  />
                  <span className="text-[10px] text-white/60">Favorite</span>
                </button>

                {/* Swipe hint */}
                <div className="flex flex-col items-center gap-1 opacity-40 px-2">
                  <div className="flex gap-1">
                    <ChevronLeft size={14} className="text-white" />
                    <ChevronRight size={14} className="text-white" />
                  </div>
                  <span className="text-[10px] text-white/60">Swipe</span>
                </div>

                {/* Comments */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowComments(true);
                  }}
                  aria-label="View comments"
                  className="flex flex-col items-center gap-1 px-4 py-1"
                >
                  <div className="relative">
                    <MessageCircle size={22} className="text-white/80" />
                    {commentCount !== null && commentCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {commentCount > 9 ? "9+" : commentCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/60">
                    {commentCount !== null && commentCount > 0
                      ? `${commentCount} comment${commentCount !== 1 ? "s" : ""}`
                      : "Comment"}
                  </span>
                </button>

                {/* Close */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onClose();
                  }}
                  aria-label="Close"
                  className="flex flex-col items-center gap-1 px-4 py-1"
                >
                  <X size={22} className="text-white/80" />
                  <span className="text-[10px] text-white/60">Close</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Photo + caption */}
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="relative z-10 flex flex-col items-center max-w-3xl w-full mx-4"
          style={{ paddingBottom: isMobile ? "100px" : "0px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.image_url}
            alt={photo.caption ?? "Memory"}
            className="max-h-[70vh] max-w-full rounded-xl shadow-2xl object-contain"
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder-poster.svg"; }}
          />

          {/* Caption — always visible */}
          {(photo.caption || photo.taken_date) && (
            <div className="mt-3 text-center space-y-0.5">
              {photo.caption && (
                <p className="handwriting text-white text-xl">{photo.caption}</p>
              )}
              {photo.taken_date && (
                <p className="text-white/50 text-sm">{formatShortDate(photo.taken_date)}</p>
              )}
            </div>
          )}

          {/* Counter */}
          <p className="mt-2 text-white/30 text-xs">{index + 1} / {photos.length}</p>

          {/* Mobile hint when controls hidden */}
          {isMobile && !showControls && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1 text-white/25 text-[11px]"
            >
              tap for controls · swipe up for comments
            </motion.p>
          )}
        </motion.div>
      </motion.div>

      {/* Comments panel */}
      {showComments && (
        <CommentPanel
          photoId={photo.id}
          onClose={() => setShowComments(false)}
        />
      )}
    </AnimatePresence>
  );
}