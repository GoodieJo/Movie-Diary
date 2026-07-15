export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db-adapter";

const SubscribeSchema = z.object({
  person: z.enum(["1", "2"]),
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  const { person, endpoint, keys } = parsed.data;

  await db.execute(
    `INSERT INTO push_subscriptions (id, person, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET person = excluded.person, p256dh = excluded.p256dh, auth = excluded.auth`,
    [crypto.randomUUID(), person, endpoint, keys.p256dh, keys.auth]
  );

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = await request.json().catch(() => null) as { endpoint?: string } | null;
  if (!body?.endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  await db.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", [body.endpoint]);
  return NextResponse.json({ success: true });
}
