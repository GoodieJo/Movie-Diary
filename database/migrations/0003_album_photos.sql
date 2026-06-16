-- Migration: 0003_album_photos.sql
-- Creates the album_photos table for "Our Album" feature.
-- Completely separate from movie photos (which are in the photos table).

CREATE TABLE IF NOT EXISTS album_photos (
  id          TEXT PRIMARY KEY,
  image_url   TEXT NOT NULL,
  r2_key      TEXT NOT NULL,
  caption     TEXT,
  taken_date  TEXT,
  favorite    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_album_created  ON album_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_album_favorite ON album_photos(favorite);
