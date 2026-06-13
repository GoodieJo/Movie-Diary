import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // dateStr is YYYY-MM-DD
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getYear(dateStr: string): string {
  return dateStr?.split("-")[0] ?? "";
}

export function getMonthName(dateStr: string): string {
  if (!dateStr) return "";
  const [, m] = dateStr.split("-").map(Number);
  return new Date(2024, m - 1, 1).toLocaleString("en-US", { month: "long" });
}

export function renderStars(rating?: number | null): string {
  if (!rating) return "☆☆☆☆☆";
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function moodEmoji(mood?: string | null): string {
  const map: Record<string, string> = {
    "Excited": "🤩", "Happy": "😊", "Relaxed": "😌", "Tired": "😴", "Sad": "😔",
    "Loved It": "😍", "Emotional": "😢", "Inspired": "✨", "Confused": "🤔", "Bored": "😑",
  };
  return mood ? (map[mood] ?? "💭") : "💭";
}

export function locationEmoji(location?: string | null): string {
  const map: Record<string, string> = {
    "Home": "🏠", "Cinema": "🎬", "Online Date": "💻", "Vacation": "✈️", "Other": "📍",
  };
  return location ? (map[location] ?? "📍") : "📍";
}
