/**
 * db-adapter.ts — Unified DB adapter
 * - Cloudflare production: D1 via getRequestContext()
 * - Local next dev: @libsql/client with a local SQLite file
 */
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { createClient, type Client, type InArgs } from "@libsql/client";

export interface DbRow { [key: string]: unknown }

export interface DbAdapter {
  query<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T[]>;
  queryFirst<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<void>;
}

// ── D1 adapter ────────────────────────────────────────────────────────────────
function makeD1Adapter(db: D1Database): DbAdapter {
  return {
    async query<T extends DbRow>(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql);
      const res  = params.length ? await stmt.bind(...params).all() : await stmt.all();
      return (res.results ?? []) as T[];
    },
    async queryFirst<T extends DbRow>(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql);
      const row  = params.length ? await stmt.bind(...params).first() : await stmt.first();
      return (row ?? null) as T | null;
    },
    async execute(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql);
      if (params.length) await stmt.bind(...params).run();
      else await stmt.run();
    },
  };
}

// ── libsql local adapter ──────────────────────────────────────────────────────
let _localClient: Client | null = null;

async function ensureSchema(client: Client) {
  try {
    await client.execute("SELECT 1 FROM movies LIMIT 1");
    return; // already set up
  } catch { /* tables missing */ }

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT, tmdb_id INTEGER,
      title TEXT NOT NULL, poster_url TEXT, genre TEXT, runtime INTEGER, overview TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS diary_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      watched_date TEXT NOT NULL, start_time TEXT, end_time TEXT,
      your_rating INTEGER, partner_rating INTEGER,
      favorite_scene TEXT, favorite_character TEXT, best_quote TEXT,
      laugh_memory TEXT, cry_memory TEXT, special_memory TEXT,
      mood_before TEXT, mood_after TEXT, location TEXT DEFAULT 'Home', snacks TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
      url TEXT NOT NULL, label TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

async function getLocalClient(): Promise<Client> {
  if (_localClient) return _localClient;

  const dbDir  = join(process.cwd(), ".local-db");
  const dbFile = join(dbDir, "movie-diary.db");
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

  _localClient = createClient({ url: `file:${dbFile}` });
  await ensureSchema(_localClient);
  return _localClient;
}

function makeLibSqlAdapter(client: Client): DbAdapter {
  return {
    async query<T extends DbRow>(sql: string, params: unknown[] = []) {
      const res = await client.execute({ sql, args: params as InArgs });
      return res.rows as unknown as T[];
    },
    async queryFirst<T extends DbRow>(sql: string, params: unknown[] = []) {
      const res = await client.execute({ sql, args: params as InArgs });
      return (res.rows[0] ?? null) as unknown as T | null;
    },
    async execute(sql: string, params: unknown[] = []) {
      await client.execute({ sql, args: params as InArgs });
    },
  };
}

// ── Public factory ─────────────────────────────────────────────────────────────
export async function getDb(): Promise<DbAdapter | null> {
  // 1. Try Cloudflare D1
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    const d1  = (ctx.env as Record<string, unknown>).DB as D1Database | undefined;
    if (d1) return makeD1Adapter(d1);
  } catch { /* not in CF runtime */ }

  // 2. Fall back to local libsql
  try {
    const client = await getLocalClient();
    return makeLibSqlAdapter(client);
  } catch (err) {
    console.error("[db-adapter] Failed to open local SQLite:", err);
    return null;
  }
}
