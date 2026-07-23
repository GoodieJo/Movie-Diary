import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db-adapter";
import { sendPush } from "@/lib/push";

export const runtime = "edge";

const WishlistSchema = z.object({
  added_by:   z.enum(["1", "2"]).default("1"),
  title:      z.string().min(1),
  poster_url: z.string().optional(),
  runtime:    z.preprocess((v) => (v === null || v === "" ? undefined : v), z.number().optional()),
  remark:     z.string().optional(),
});

export async function GET() {
  const db = await getDb();
  if (!db) return NextResponse.json({ items: [] });

  const items = await db.query(
    "SELECT * FROM wishlist ORDER BY created_at DESC"
  );
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database not available. Check D1 binding in Cloudflare dashboard." },
      { status: 503 }
    );
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = WishlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  const d = parsed.data;

  try {
    await db.execute(
      "INSERT INTO wishlist (title, poster_url, runtime, remark, added_by) VALUES (?,?,?,?,?)",
      [d.title, d.poster_url ?? null, d.runtime ?? null, d.remark ?? null, d.added_by]
    );

    const item = await db.queryFirst("SELECT * FROM wishlist ORDER BY id DESC LIMIT 1");

    await sendPush(d.added_by, {
      title: "New wishlist idea 🌙",
      body:  `"${d.title}" was added to your watch wishlist.`,
      url:   "/wishlist",
    }).catch(() => {});

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/wishlist]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
