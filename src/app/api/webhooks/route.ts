import { NextResponse } from "next/server";
import {
  handleCallAnalyticsWebhook,
  type WebhookPayload,
} from "@/lib/webhook-controller";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks
 * Primary inbound webhook endpoint. External services (CRM, dialers, GHL,
 * the built-in transmitter form) POST their JSON payload here.
 */
export async function POST(req: Request) {
  let payload: WebhookPayload;

  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body. Send a JSON object payload.",
      },
      { status: 400 }
    );
  }

  const result = await handleCallAnalyticsWebhook(payload, "api/webhooks");

  return NextResponse.json(
    {
      success: result.ok,
      action: result.action,
      matchedBy: result.matchedBy,
      id: result.id ?? null,
      receivedFields: result.receivedFields ?? 0,
      message: result.message,
      processed_at: new Date().toISOString(),
    },
    { status: result.ok ? result.status : result.status }
  );
}

/** GET /api/webhooks — endpoint introspection / health for integrators. */
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: "/api/webhooks",
    method: "POST",
    description:
      "Inbound webhook receiver. POST a JSON payload with any of the 49 CRM/contact fields. Smart-upsert matches on sid → result_id → phone.",
    aliases: ["/api/webhook/*"],
    read_api: "/api/ghl/call-analytics",
  });
}
