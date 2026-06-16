"use client";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

interface Props {
  onConfirm: () => void;
  onCancel:  () => void;
  loading:   boolean;
}

export function DeleteConfirm({ onConfirm, onCancel, loading }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative z-10 bg-[#fffdf7] rounded-2xl p-6 max-w-sm w-full shadow-lift border border-[#e8dcc8] text-center"
      >
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-rose-500" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[#3d2b1f] mb-2">
          Remove this memory?
        </h3>
        <p className="text-sm text-[#9e7a60] mb-5">
          This will permanently delete the photo from your album and storage.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#f5ede4] text-[#3d2b1f] rounded-xl text-sm font-medium border border-[#e8dcc8] hover:bg-[#ead8c8] transition-colors"
          >
            Keep It
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-rose-400 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Removing…" : "Yes, Remove"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
