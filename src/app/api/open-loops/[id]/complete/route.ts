import { NextResponse } from "next/server";

type Params = {
  params: { id: string };
};

export async function POST(_req: Request, { params }: Params) {
  const baseUrl = process.env.INTEL_BASE_URL;
  const apiKey = process.env.INTEL_API_KEY;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "Open loops connection details are not configured." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${baseUrl}/open-loops/${params.id}/complete`, {
      method: "POST",
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Failed to mark as done: ${text || res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error completing open loop", error);
    return NextResponse.json(
      { error: "Unable to update this item right now." },
      { status: 500 }
    );
  }
}
