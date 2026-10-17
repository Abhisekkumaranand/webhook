import { NextResponse } from "next/server";
import { db } from "@/db";
import { callAnalytics } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/ghl/call-analytics
 * Read API consumed by the live CallAnalytics dashboard (auto-polls every 5s).
 * Optional ?limit= (default 200, max 500).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitParam = parseInt(searchParams.get("limit") ?? "200", 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 500)
    : 200;

  const rows = await db
    .select()
    .from(callAnalytics)
    .orderBy(desc(callAnalytics.updatedAt))
    .limit(limit);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(callAnalytics);

  return NextResponse.json({
    success: true,
    count,
    returned: rows.length,
    data: rows,
    fetched_at: new Date().toISOString(),
  });
}

/** DELETE /api/ghl/call-analytics — wipe every record (dev utility). */
export async function DELETE() {
  await db.delete(callAnalytics);
  return NextResponse.json({ success: true, message: "All CallAnalytics records deleted." });
}
