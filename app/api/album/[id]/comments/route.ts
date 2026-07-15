export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";
import { sendPush } from "@/lib/push";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const comments = await db.query(
    `SELECT * FROM album_comments WHERE photo_id = ? ORDER BY created_at ASC`,
    [id]
  );

  return NextResponse.json({ data: comments });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = await request.json() as {
    author: string;
    emoji: string;
    content: string;
    parent_id?: string;
  };

  if (!body.author || !body.content || !body.emoji) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const commentId = crypto.randomUUID();
  await db.execute(
    `INSERT INTO album_comments (id, photo_id, author, emoji, content, parent_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [commentId, id, body.author, body.emoji, body.content.trim(), body.parent_id ?? null]
  );

  const comment = await db.queryFirst(
    "SELECT * FROM album_comments WHERE id = ?", [commentId]
  );

  const person1Name = await db.queryFirst<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'person1_name'"
  );
  const commenterIsPerson1 = body.author === (person1Name?.value ?? "Him");

  await sendPush(commenterIsPerson1 ? "1" : "2", {
    title: `${body.emoji} ${body.author} commented`,
    body:  body.content.trim(),
    url:   "/album",
  }).catch(() => {});

  return NextResponse.json({ data: comment }, { status: 201 });
}