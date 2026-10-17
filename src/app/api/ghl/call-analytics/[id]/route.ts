import { NextResponse } from "next/server";
import { db } from "@/db";
import { callAnalytics } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/ghl/call-analytics/:id — single record. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(callAnalytics)
    .where(eq(callAnalytics.id, numId))
    .limit(1);

  if (!rows[0]) {
    return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: rows[0] });
}

/** DELETE /api/ghl/call-analytics/:id — remove a single record. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  }

  const deleted = await db
    .delete(callAnalytics)
    .where(eq(callAnalytics.id, numId))
    .returning({ id: callAnalytics.id });

  if (!deleted[0]) {
    return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: `Record #${numId} deleted.` });
}
