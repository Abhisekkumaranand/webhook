import { NextResponse } from "next/server";
import {
  handleCallAnalyticsWebhook,
  type WebhookPayload,
} from "@/lib/webhook-controller";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhook/*  (wildcard receiver)
 * Mirrors the Express-style `/api/webhook/*` route so external tools can
 * post to any nested path, e.g. /api/webhook/ghl, /api/webhook/dialer/ivr.
 * The path segments are forwarded as the `webhookSource` label.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const source = `/api/webhook/${(path ?? []).join("/")}`;

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body. Send a JSON object payload." },
      { status: 400 }
    );
  }

  const result = await handleCallAnalyticsWebhook(payload, source);

  return NextResponse.json(
    {
      success: result.ok,
      action: result.action,
      matchedBy: result.matchedBy,
      id: result.id ?? null,
      receivedFields: result.receivedFields ?? 0,
      message: result.message,
      source,
      processed_at: new Date().toISOString(),
    },
    { status: result.ok ? result.status : result.status }
  );
}
