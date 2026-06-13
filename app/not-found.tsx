"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring" }}
      >
        <div className="text-7xl mb-6">📽️</div>
        <h1 className="font-display text-4xl font-bold text-[#3d2b1f] mb-2">
          Page Not Found
        </h1>
        <p className="handwriting text-rose-400 text-xl mb-8">
          this memory seems to be lost...
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-rose-400 hover:bg-rose-500 text-white rounded-xl font-semibold transition-colors shadow-md"
        >
          🏠 Back to Diary
        </Link>
      </motion.div>
    </div>
  );
}
