// Core database types

export interface Movie {
  id: number;
  tmdb_id?: number;
  title: string;
  poster_url?: string;
  genre?: string;
  runtime?: number;
  overview?: string;
  created_at: string;
}

export interface DiaryEntry {
  id: number;
  movie_id: number;
  watched_date: string;
  start_time?: string;
  end_time?: string;
  your_rating?: number;
  partner_rating?: number;
  favorite_scene?: string;
  favorite_character?: string;
  best_quote?: string;
  laugh_memory?: string;
  cry_memory?: string;
  special_memory?: string;
  mood_before?: MoodBefore;
  mood_after?: MoodAfter;
  location?: WatchLocation;
  snacks?: string;
  created_at: string;
  // Joined / flattened from SQL JOIN (API returns these directly)
  movie?: Movie;
  photos?: Photo[];
  title?: string;
  poster_url?: string;
  genre?: string;
  runtime?: number;
  overview?: string;
  tmdb_id?: number;
}

export interface WishlistItem {
  id: number;
  title: string;
  poster_url?: string;
  runtime?: number;
  remark?: string;
  added_by: "1" | "2";
  created_at: string;
}

export interface Photo {
  id: number;
  entry_id: number;
  url: string;
  label?: string;
  created_at: string;
}

// Enums
export type MoodBefore = "Excited" | "Happy" | "Relaxed" | "Tired" | "Sad";
export type MoodAfter  = "Loved It" | "Emotional" | "Inspired" | "Confused" | "Bored";
export type WatchLocation = "Home" | "Cinema" | "Online Date" | "Vacation" | "Other";

export const MOODS_BEFORE: MoodBefore[] = ["Excited", "Happy", "Relaxed", "Tired", "Sad"];
export const MOODS_AFTER:  MoodAfter[]  = ["Loved It", "Emotional", "Inspired", "Confused", "Bored"];
export const WATCH_LOCATIONS: WatchLocation[] = ["Home", "Cinema", "Online Date", "Vacation", "Other"];

// TMDb types
export interface TMDbSearchResult {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  genre_ids?: number[];
  overview?: string;
  runtime?: number;
}

export interface TMDbMovieDetails {
  id: number;
  title: string;
  poster_path?: string;
  genres: { id: number; name: string }[];
  runtime?: number;
  overview?: string;
  release_date?: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Stats type
export interface DiaryStats {
  total_movies: number;
  movies_this_year: number;
  movies_this_month: number;
  avg_rating: number;
  most_watched_genre?: string;
  longest_movie?: { title: string; runtime: number };
  highest_rated?: { title: string; rating: number };
  by_genre: { genre: string; count: number }[];
  by_month: { month: string; count: number }[];
  ratings_distribution: { stars: number; count: number }[];
}

// Achievement type
export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  threshold: number;
}

// Form input types
export interface EntryFormData {
  tmdb_id?: number;
  title: string;
  poster_url?: string;
  genre?: string;
  runtime?: number;
  overview?: string;
  watched_date: string;
  start_time?: string;
  end_time?: string;
  your_rating?: number;
  partner_rating?: number;
  favorite_scene?: string;
  favorite_character?: string;
  best_quote?: string;
  laugh_memory?: string;
  cry_memory?: string;
  special_memory?: string;
  mood_before?: MoodBefore;
  mood_after?: MoodAfter;
  location?: WatchLocation;
  snacks?: string;
}

// Filter/sort state
export interface EntryFilters {
  search: string;
  genre: string;
  year: string;
  sort: "newest" | "oldest" | "highest_rated";
}
