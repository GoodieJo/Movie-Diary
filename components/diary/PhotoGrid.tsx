"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Photo { id: number; url: string; label?: string }

export function PhotoGrid({ photos, onDelete }: { photos: Photo[]; onDelete?: (id: number) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map(photo => (
          <div key={photo.id} className="relative group">
            <button
              type="button"
              onClick={() => setSelected(photo.url)}
              className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#f0e6d2] shadow-sm cursor-zoom-in block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.label ?? "Photo"}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = "/placeholder-poster.svg"; }}
              />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                className="absolute top-1 right-1 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X size={12} className="text-[#3d2b1f]" />
              </button>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-white hover:text-rose-300 transition-colors"
            >
              <X size={28} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={selected}
              alt="Full size"
              className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}