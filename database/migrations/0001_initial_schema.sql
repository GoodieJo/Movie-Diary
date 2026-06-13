-- Migration: 0001_initial_schema.sql

CREATE TABLE IF NOT EXISTS movies (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tmdb_id    INTEGER,
  title      TEXT NOT NULL,
  poster_url TEXT,
  genre      TEXT,
  runtime    INTEGER,
  overview   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diary_entries (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id          INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  watched_date      TEXT NOT NULL,
  start_time        TEXT,
  end_time          TEXT,
  your_rating       INTEGER CHECK(your_rating BETWEEN 1 AND 5),
  partner_rating    INTEGER CHECK(partner_rating BETWEEN 1 AND 5),
  favorite_scene    TEXT,
  favorite_character TEXT,
  best_quote        TEXT,
  laugh_memory      TEXT,
  cry_memory        TEXT,
  special_memory    TEXT,
  mood_before       TEXT,
  mood_after        TEXT,
  location          TEXT DEFAULT 'Home',
  snacks            TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS photos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id   INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  label      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entries_watched_date ON diary_entries(watched_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_movie_id     ON diary_entries(movie_id);
CREATE INDEX IF NOT EXISTS idx_photos_entry_id      ON photos(entry_id);
