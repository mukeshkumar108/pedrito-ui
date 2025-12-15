import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawBase = process.env.WHATSAPP_BASE_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!rawBase) {
    return NextResponse.json({ error: "WHATSAPP_BASE_URL is not configured" }, { status: 500 });
  }

  const base = rawBase.replace(/\/+$/, "");
  const upstreamUrl = `${base}/qr`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[whatsapp/qr] Backend error", res.status, text);
      return NextResponse.json(
        { error: "Failed to fetch WhatsApp QR", details: text },
        { status: res.status }
      );
    }

    const json = await res.json();

    const rawQr = json?.qr;
    if (!rawQr || typeof rawQr !== "string") {
      console.error("[whatsapp/qr] No valid 'qr' field in upstream json");
      return NextResponse.json(
        { error: "Upstream QR JSON has no valid 'qr' field" },
        { status: 500 }
      );
    }

    const trimmed = rawQr.trim();
    const base64Part = trimmed.replace(/^data:[^,]+,/, "");

    try {
      const buffer = Buffer.from(base64Part, "base64");
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        },
      });
    } catch (e) {
      console.error("[whatsapp/qr] Failed to decode base64", e);
      return NextResponse.json({ error: "Failed to decode QR base64" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[whatsapp/qr] Proxy error", err);
    return NextResponse.json(
      { error: "Failed to contact WhatsApp backend", details: err?.message },
      { status: 500 }
    );
  }
}
