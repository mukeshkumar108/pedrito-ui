import { NextResponse } from "next/server";

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
      console.error("[whatsapp/qr-raw] Backend error", res.status, text);
      return NextResponse.json(
        { error: `Failed to fetch WhatsApp QR: ${text || res.status}` },
        { status: res.status }
      );
    }

    const bodyText = await res.text();
    return NextResponse.json({
      raw: bodyText,
      length: bodyText.length,
    });
  } catch (error) {
    console.error("[whatsapp/qr-raw] Error fetching WhatsApp QR", error);
    return NextResponse.json(
      { error: "Unable to reach WhatsApp right now." },
      { status: 500 }
    );
  }
}
