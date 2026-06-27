-- Comments for album photos
CREATE TABLE IF NOT EXISTS album_comments (
  id         TEXT PRIMARY KEY,
  photo_id   TEXT NOT NULL REFERENCES album_photos(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  content    TEXT NOT NULL,
  parent_id  TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  edited_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_comments_photo    ON album_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent   ON album_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created  ON album_comments(created_at);

-- App-wide settings (key-value)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default names and emojis
INSERT OR IGNORE INTO settings (key, value) VALUES ('person1_name',  'Him');
INSERT OR IGNORE INTO settings (key, value) VALUES ('person1_emoji', '🫘');
INSERT OR IGNORE INTO settings (key, value) VALUES ('person2_name',  'Her');
INSERT OR IGNORE INTO settings (key, value) VALUES ('person2_emoji', '🌻');