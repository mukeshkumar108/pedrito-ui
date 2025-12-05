"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OpenLoop, OpenLoopsList } from "./OpenLoopsList";

type DigestSummary = {
  narrativeSummary?: string;
  keyPeople?: string[];
  keyTopics?: string[];
};

type DigestResponse = {
  summary?: DigestSummary;
};

export function DashboardSection() {
  const [digest, setDigest] = useState<DigestSummary | null>(null);
  const [loops, setLoops] = useState<OpenLoop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDigest = useCallback(async () => {
    const res = await fetch("/api/digest/today", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const data: DigestResponse = await res.json();
    setDigest(data.summary ?? null);
  }, []);

  const fetchLoops = useCallback(async () => {
    const res = await fetch("/api/open-loops/active", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const data = await res.json();
    const loopsList: OpenLoop[] = Array.isArray(data)
      ? data
      : data.loops || data.openLoops || data.open_loop || [];
    setLoops(loopsList);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await Promise.all([fetchDigest(), fetchLoops()]);
    } catch (err) {
      console.error("Dashboard fetch failed", err);
      setError("Having trouble loading Pedrito’s check-in. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [fetchDigest, fetchLoops]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasChips = useMemo(() => {
    return (digest?.keyTopics?.length || 0) > 0 || (digest?.keyPeople?.length || 0) > 0;
  }, [digest]);

  const narrative =
    digest?.narrativeSummary ||
    "Quiet so far. Once your chats pick up, I’ll summarise the important bits here in normal human language.";

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-7 shadow-2xl ring-1 ring-white/5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-100 ring-1 ring-blue-400/30">
          Today with Pedrito
        </span>
        {loading && (
          <span className="text-xs text-slate-200/70">Pulling your check-in...</span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h2 className="text-2xl font-semibold text-white">Your daily WhatsApp check-in</h2>
        <p className="text-sm leading-relaxed text-slate-200/80">{narrative}</p>
      </div>

      {hasChips && (
        <div className="mt-4 flex flex-wrap gap-2">
          {digest?.keyTopics?.map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 ring-1 ring-white/15"
            >
              {topic}
            </span>
          ))}
          {digest?.keyPeople?.map((person) => (
            <span
              key={person}
              className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-400/30"
            >
              {person}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-2">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-200/60">
            Things still hanging open
          </p>
          <h3 className="text-xl font-semibold text-white">What people might be waiting on</h3>
          <p className="text-xs text-slate-200/70">
            These are the promises, questions and follow-ups Pedrito spotted in your recent
            chats. Anything you mark as Done or Not important disappears. Anything you leave open
            will roll over into tomorrow’s list.
          </p>
        </div>

        <OpenLoopsList loops={loops} onChange={fetchLoops} />
      </div>

      {error && <p className="mt-4 text-xs text-amber-100/80">{error}</p>}
    </section>
  );
}
