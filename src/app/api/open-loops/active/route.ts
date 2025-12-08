import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.INTEL_BASE_URL;
  const apiKey = process.env.INTEL_API_KEY;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "Open loops connection details are not configured." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${baseUrl}/open-loops/active`, {
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Failed to fetch open loops: ${text || res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    const toCreatedAt = (value: unknown) => {
      if (value === null || value === undefined) return undefined;

      // Support epoch seconds by expanding to ms
      if (typeof value === "number" && value < 1e12) {
        const secDate = new Date(value * 1000);
        if (!Number.isNaN(secDate.getTime())) return secDate.toISOString();
      }

      const date = new Date(value as string | number | Date);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    };

    const normalizeLoop = (loop: any) => {
      const createdAtCandidate =
        loop?.createdAt ??
        loop?.created_at ??
        loop?.timestamp ??
        loop?.time ??
        loop?.messageTimestamp ??
        loop?.message_timestamp;
      const createdAt = toCreatedAt(createdAtCandidate);
      return createdAt ? { ...loop, createdAt } : loop;
    };

    if (Array.isArray(data)) {
      return NextResponse.json(data.map(normalizeLoop));
    }

    if (Array.isArray((data as any)?.loops)) {
      return NextResponse.json({ ...data, loops: (data as any).loops.map(normalizeLoop) });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching open loops", error);
    return NextResponse.json(
      { error: "Unable to fetch open loops right now." },
      { status: 500 }
    );
  }
}
