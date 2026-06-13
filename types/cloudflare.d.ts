// Minimal D1 type shims so TypeScript is happy outside of the Cloudflare runtime.
// In production these come from @cloudflare/workers-types.

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  raw<T = unknown[]>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1Result>;
  batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[]
  ): Promise<D1Result<T>[]>;
}

interface R2Bucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream | string | null,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<void>;
  get(key: string): Promise<{ body: ReadableStream; arrayBuffer(): Promise<ArrayBuffer> } | null>;
  delete(key: string): Promise<void>;
}
