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
    const loopsPromise = fetch(`${baseUrl}/open-loops/active`, {
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
    });
    const peoplePromise = fetch(`${baseUrl}/relationships/people`, {
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
    }).catch((error) => {
      console.error("Error fetching people", error);
      return null;
    });

    const [loopsRes, peopleRes] = await Promise.all([loopsPromise, peoplePromise]);

    if (!loopsRes.ok) {
      const text = await loopsRes.text();
      return NextResponse.json(
        { error: `Failed to fetch open loops: ${text || loopsRes.status}` },
        { status: loopsRes.status }
      );
    }

    const data = await loopsRes.json();
    const peopleData = peopleRes && peopleRes.ok ? await peopleRes.json() : null;
    const peopleList: Array<{ chatId?: string; displayName?: string }> = Array.isArray(peopleData?.people)
      ? peopleData.people
      : [];
    const peopleByChatId = new Map<string, string>();
    for (const person of peopleList) {
      if (person?.chatId && person.displayName) {
        peopleByChatId.set(person.chatId, person.displayName);
      }
    }

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
        loop?.lastSeenTs ??
        loop?.createdAt ??
        loop?.created_at ??
        loop?.timestamp ??
        loop?.time ??
        loop?.messageTimestamp ??
        loop?.message_timestamp ??
        loop?.firstSeenTs ??
        loop?.lastSeen_ts ??
        loop?.lastSeen;

      const whenCandidate =
        loop?.when ??
        loop?.whenDate ??
        (Array.isArray(loop?.whenOptions) && loop.whenOptions.length > 0 ? loop.whenOptions[0] : undefined);

      const displayName =
        loop?.displayName ||
        (loop?.chatId && peopleByChatId.get(loop.chatId)) ||
        (loop?.chat_id && peopleByChatId.get(loop.chat_id)) ||
        loop?.chatId ||
        (loop as any)?.chat_id ||
        "Unknown";

      return {
        ...loop,
        displayName,
        what: loop?.what ?? loop?.summary ?? loop?.title ?? loop?.text,
        who: loop?.who ?? loop?.actor ?? loop?.from,
        when: whenCandidate ?? null,
        category: loop?.category ?? loop?.type,
        status: loop?.status,
        createdAt: toCreatedAt(createdAtCandidate),
      };
    };

    const normalizeCollection = (collection: any) => Array.isArray(collection) ? collection.map(normalizeLoop) : [];

    if (Array.isArray(data)) {
      return NextResponse.json(normalizeCollection(data));
    }

    if (Array.isArray((data as any)?.loops)) {
      return NextResponse.json({ ...data, loops: normalizeCollection((data as any).loops) });
    }

    if (Array.isArray((data as any)?.openLoops)) {
      return NextResponse.json({ ...data, loops: normalizeCollection((data as any).openLoops) });
    }

    if (Array.isArray((data as any)?.activeOpenLoops)) {
      return NextResponse.json({
        ...data,
        loops: normalizeCollection((data as any).activeOpenLoops),
      });
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
