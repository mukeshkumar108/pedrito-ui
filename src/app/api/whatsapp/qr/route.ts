import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawBase = process.env.WHATSAPP_BASE_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!rawBase) {
    return NextResponse.json(
      { error: "WhatsApp connection details are not configured." },
      { status: 500 }
    );
  }

  const base = rawBase.replace(/\/+$/, "");

  try {
    const res = await fetch(`${base}/qr`, {
      headers: apiKey
        ? {
            Authorization: `Bearer ${apiKey}`,
          }
        : undefined,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[whatsapp/qr] Backend error", res.status, text);
      return NextResponse.json(
        { error: "Failed to fetch WhatsApp QR", details: text || res.status },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("image/png")) {
      const arrayBuffer = await res.arrayBuffer();
      return new Response(arrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        },
      });
    }

    const bodyText = await res.text();
    const trimmed = bodyText.trim();
    const base64Part = trimmed.replace(/^data:[^,]+,/, "");
    const buffer = Buffer.from(base64Part, "base64");

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[whatsapp/qr] Proxy error", error);
    return NextResponse.json(
      { error: "Unable to reach WhatsApp right now." },
      { status: 500 }
    );
  }
}
