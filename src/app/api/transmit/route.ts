import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/transmit
 * Server-side Webhook Relay/Proxy.
 * Eliminates browser CORS, Referrer-Policy restriction, and ngrok interstitial warning pages.
 */
export async function POST(req: Request) {
  try {
    const { targetUrl, payload } = await req.json();

    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json(
        { ok: false, error: "targetUrl is required" },
        { status: 400 }
      );
    }

    const trimmedUrl = targetUrl.trim();

    // Make server-to-server request (never blocked by browser CORS/Referrer policy)
    const upstreamRes = await fetch(trimmedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "HookStream-Webhook-Transmitter/1.0",
      },
      body: JSON.stringify(payload ?? {}),
    });

    const contentType = upstreamRes.headers.get("content-type") || "";
    let body: unknown;

    if (contentType.includes("application/json")) {
      try {
        body = await upstreamRes.json();
      } catch {
        body = await upstreamRes.text();
      }
    } else {
      const text = await upstreamRes.text();
      // Check for ngrok offline error
      if (text.includes("ERR_NGROK_3200") || text.includes("is offline")) {
        return NextResponse.json(
          {
            ok: false,
            status: 404,
            body: {
              error: "Ngrok tunnel is offline (ERR_NGROK_3200).",
              message: "Ye ngrok URL expire ho chuka hai ya band hai. Naya running ngrok URL use karein.",
            },
          },
          { status: 404 }
        );
      }
      body = text;
    }

    return NextResponse.json({
      ok: upstreamRes.ok,
      status: upstreamRes.status,
      body,
      targetUrl: trimmedUrl,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        status: 500,
        body: {
          error: err instanceof Error ? err.message : "Failed to transmit webhook",
        },
      },
      { status: 500 }
    );
  }
}
