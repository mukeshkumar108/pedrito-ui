import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.INTEL_BASE_URL;
  const apiKey = process.env.INTEL_API_KEY;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "Digest connection details are not configured." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${baseUrl}/digest/today`, {
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Failed to fetch digest: ${text || res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching digest", error);
    return NextResponse.json(
      { error: "Unable to fetch digest right now." },
      { status: 500 }
    );
  }
}
