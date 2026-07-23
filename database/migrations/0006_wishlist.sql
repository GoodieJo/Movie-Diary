-- Migration: 0006_wishlist.sql
-- Movies you want to watch together, before they become a diary entry.

CREATE TABLE IF NOT EXISTS wishlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  poster_url TEXT,
  runtime    INTEGER,
  remark     TEXT,
  added_by   TEXT NOT NULL DEFAULT '1' CHECK(added_by IN ('1','2')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wishlist_created ON wishlist(created_at DESC);
