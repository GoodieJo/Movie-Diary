-- Migration: 0005_push_notifications.sql
-- Web Push subscriptions + "who added this" tags so notifications can skip the actor.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         TEXT PRIMARY KEY,
  person     TEXT NOT NULL CHECK(person IN ('1','2')),
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_person ON push_subscriptions(person);

ALTER TABLE diary_entries ADD COLUMN added_by TEXT NOT NULL DEFAULT '1' CHECK(added_by IN ('1','2'));
ALTER TABLE album_photos  ADD COLUMN added_by TEXT NOT NULL DEFAULT '1' CHECK(added_by IN ('1','2'));
