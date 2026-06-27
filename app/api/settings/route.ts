export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-adapter";

export async function GET() {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const rows = await db.query<{ key: string; value: string }>(
    "SELECT key, value FROM settings"
  );

  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;

  return NextResponse.json({ data: settings });
}

export async function PATCH(request: NextRequest) {
  const db = await getDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const body = await request.json() as Record<string, string>;
  const allowed = ["person1_name", "person1_emoji", "person2_name", "person2_emoji"];

  for (const [key, value] of Object.entries(body)) {
    if (!allowed.includes(key)) continue;
    await db.execute(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, value]
    );
  }

  const rows = await db.query<{ key: string; value: string }>("SELECT key, value FROM settings");
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;

  return NextResponse.json({ data: settings });
}