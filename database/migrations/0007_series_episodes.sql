-- Migration: 0007_series_episodes.sql
-- Movies can now be a "series" with multiple watched episodes, each with its own date/time.

ALTER TABLE movies ADD COLUMN media_type TEXT NOT NULL DEFAULT 'movie' CHECK(media_type IN ('movie','series'));

CREATE TABLE IF NOT EXISTS episodes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id       INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  watched_date   TEXT NOT NULL,
  start_time     TEXT,
  end_time       TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_episodes_entry_id ON episodes(entry_id);
