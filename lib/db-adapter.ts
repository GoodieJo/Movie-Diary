export interface DbRow { [key: string]: unknown }

export interface DbAdapter {
  query<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T[]>;
  queryFirst<T extends DbRow = DbRow>(sql: string, params?: unknown[]): Promise<T | null>;
  execute(sql: string, params?: unknown[]): Promise<void>;
}

function makeD1Adapter(db: D1Database): DbAdapter {
  return {
    async query<T extends DbRow>(sql: string, params: unknown[] = []) {
      const res = params.length
        ? await db.prepare(sql).bind(...params).all()
        : await db.prepare(sql).all();
      return (res.results ?? []) as T[];
    },
    async queryFirst<T extends DbRow>(sql: string, params: unknown[] = []) {
      const row = params.length
        ? await db.prepare(sql).bind(...params).first()
        : await db.prepare(sql).first();
      return (row ?? null) as T | null;
    },
    async execute(sql: string, params: unknown[] = []) {
      if (params.length) await db.prepare(sql).bind(...params).run();
      else await db.prepare(sql).run();
    },
  };
}

export async function getDb(): Promise<DbAdapter | null> {
  // Cloudflare D1 (edge runtime)
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    const d1  = (ctx.env as Record<string, unknown>).DB as D1Database | undefined;
    if (d1) return makeD1Adapter(d1);
  } catch { /* not on Cloudflare */ }

  // Local Node.js dev only — tree-shaken away on edge builds
  if (process.env.NEXT_RUNTIME !== "edge") {
    try {
      const { createClient } = await import("@libsql/client");
      const { existsSync, mkdirSync } = await import("fs");
      const { join } = await import("path");

      const dbDir  = join(process.cwd(), ".local-db");
      const dbFile = join(dbDir, "movie-diary.db");
      if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

      const client = createClient({ url: `file:${dbFile}` });

      try { await client.execute("SELECT 1 FROM movies LIMIT 1"); }
      catch {
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

      type Args = Parameters<typeof client.execute>[0] extends { args: infer A } ? A : never;
      return {
        async query<T extends DbRow>(sql: string, params: unknown[] = []) {
          const res = await client.execute({ sql, args: params as Args });
          return res.rows as unknown as T[];
        },
        async queryFirst<T extends DbRow>(sql: string, params: unknown[] = []) {
          const res = await client.execute({ sql, args: params as Args });
          return (res.rows[0] ?? null) as unknown as T | null;
        },
        async execute(sql: string, params: unknown[] = []) {
          await client.execute({ sql, args: params as Args });
        },
      };
    } catch (err) {
      console.error("[db] local adapter failed:", err);
    }
  }

  return null;
}