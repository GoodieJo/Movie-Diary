"use client";
import { motion } from "framer-motion";

// Fixed positions/timings (not random) so SSR and client render identically
const PARTICLES = [
  { left: "8%",  top: "15%", size: 4,  duration: 9,  delay: 0,   emoji: "🌷" },
  { left: "85%", top: "20%", size: 3,  duration: 11, delay: 1.2, emoji: "🌷" },
  { left: "20%", top: "70%", size: 5,  duration: 8,  delay: 0.5, emoji: "🌷" },
  { left: "75%", top: "65%", size: 3,  duration: 10, delay: 2,   emoji: "🌷" },
  { left: "45%", top: "10%", size: 18, duration: 7,  delay: 0.3, emoji: "✨" },
  { left: "12%", top: "45%", size: 16, duration: 9,  delay: 1.8, emoji: "✨" },
  { left: "90%", top: "45%", size: 14, duration: 8.5,delay: 0.8, emoji: "✨" },
  { left: "60%", top: "85%", size: 16, duration: 10, delay: 1.4, emoji: "✨" },
  { left: "30%", top: "30%", size: 3,  duration: 12, delay: 0.6, emoji: "🌻" },
  { left: "55%", top: "55%", size: 4,  duration: 9.5,delay: 2.4, emoji: "🌻" },
  { left: "5%",  top: "80%", size: 3,  duration: 11, delay: 0.9, emoji: "🌻" },
  { left: "95%", top: "78%", size: 5,  duration: 8,  delay: 1.6, emoji: "🌻" },
];

export function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: p.left,
            top: p.top,
            width: p.emoji ? undefined : p.size,
            height: p.emoji ? undefined : p.size,
            fontSize: p.emoji ? p.size : undefined,
            borderRadius: p.emoji ? undefined : "50%",
            background: p.emoji ? undefined : "rgba(227, 190, 106, 0.35)",
          }}
          animate={{
            y: [0, -22, 0],
            opacity: [0.15, 0.6, 0.15],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}