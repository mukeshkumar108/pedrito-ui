import { NextResponse } from "next/server";

export async function GET() {
  const rawBase = process.env.INTEL_BASE_URL;
  const apiKey = process.env.INTEL_API_KEY;

  if (!rawBase) {
    return NextResponse.json(
      { error: "Digest connection details are not configured." },
      { status: 500 }
    );
  }

  const base = rawBase.replace(/\/+$/, "");
  const upstreamUrl = `${base}/digest/today`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
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

    const toCreatedAt = (value: unknown) => {
      if (value === null || value === undefined) return undefined;
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
        loop?.message_timestamp ??
        loop?.firstSeenTs ??
        loop?.lastSeenTs;

      const whenCandidate =
        loop?.when ??
        (Array.isArray(loop?.whenOptions) && loop.whenOptions.length > 0 ? loop.whenOptions[0] : undefined);

      return {
        ...loop,
        what: loop?.what ?? loop?.summary ?? loop?.title ?? loop?.text,
        who: loop?.who ?? loop?.actor ?? loop?.from,
        when: whenCandidate ?? null,
        category: loop?.category ?? loop?.type,
        status: loop?.status,
        createdAt: toCreatedAt(createdAtCandidate),
      };
    };

    const activeLoops =
      (Array.isArray((data as any)?.openLoops?.active) && (data as any).openLoops.active) ||
      (Array.isArray((data as any)?.open_loops?.active) && (data as any).open_loops.active) ||
      (Array.isArray((data as any)?.activeOpenLoops) && (data as any).activeOpenLoops) ||
      [];

    const openLoops = {
      ...(data as any)?.openLoops,
      active: activeLoops.map(normalizeLoop),
    };

    const payload = { ...data, openLoops };

    if (process.env.NODE_ENV !== "production") {
      console.log("[intel/digest] upstream", data);
      console.log("[intel/digest] normalized", payload);
    }

    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    console.error("Error fetching digest", error);
    return NextResponse.json(
      { error: "Unable to fetch digest right now." },
      { status: 500 }
    );
  }
}
