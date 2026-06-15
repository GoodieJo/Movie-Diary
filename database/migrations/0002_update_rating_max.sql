-- Recreate diary_entries with updated CHECK constraint (1-10 instead of 1-5)
-- Existing data (ratings 1-5) remains valid and is preserved.

CREATE TABLE diary_entries_new (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id          INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  watched_date      TEXT NOT NULL,
  start_time        TEXT,
  end_time          TEXT,
  your_rating       INTEGER CHECK(your_rating BETWEEN 1 AND 10),
  partner_rating    INTEGER CHECK(partner_rating BETWEEN 1 AND 10),
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

INSERT INTO diary_entries_new SELECT * FROM diary_entries;

DROP TABLE diary_entries;

ALTER TABLE diary_entries_new RENAME TO diary_entries;

CREATE INDEX IF NOT EXISTS idx_entries_watched_date ON diary_entries(watched_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_movie_id     ON diary_entries(movie_id);