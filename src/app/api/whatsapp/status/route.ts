import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.WHATSAPP_BASE_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: "WhatsApp connection details are not configured." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${baseUrl}/status`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Failed to fetch WhatsApp status: ${text || res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching WhatsApp status", error);
    return NextResponse.json(
      { error: "Unable to reach WhatsApp right now." },
      { status: 500 }
    );
  }
}
