"use client";

import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";

export type OpenLoopCategory =
  | "promise"
  | "follow_up"
  | "question"
  | "time_sensitive"
  | string
  | undefined;

export type OpenLoopStatus = "open" | "done" | "dismissed" | string | undefined;

export interface OpenLoop {
  id: string;
  chatId?: string;
  actor?: string;
  isGroup?: boolean;
  summary?: string;
  surfaceType?: string;
  urgency?: string;
  importance?: number;
  lastSeenTs?: number;
  lane?: string;
  displayName?: string;
  name?: string;
  firstSeenTs?: number;
  who?: string;
  what?: string;
  when?: string | null;
  category?: OpenLoopCategory;
  status?: OpenLoopStatus;
  createdAt?: string;
}

interface OpenLoopsListProps {
  loops: OpenLoop[];
  onChange?: (update: { id: string; action: "complete" | "dismiss" }) => void;
}

export function OpenLoopsList({ loops, onChange }: OpenLoopsListProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [confetti, setConfetti] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/animations/star-confetti.json");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) setConfetti(data);
      } catch (err) {
        console.error("Failed to load confetti animation", err);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const groups = useMemo(() => {
    const result: Record<string, OpenLoop[]> = { now: [], backlog: [], other: [] };
    (loops || []).forEach((loop) => {
      const laneKey = (loop.lane || "").toLowerCase();
      if (laneKey === "now") {
        result.now.push(loop);
      } else if (laneKey === "backlog") {
        result.backlog.push(loop);
      } else {
        result.other.push(loop);
      }
    });
    const sortByLastSeen = (a: OpenLoop, b: OpenLoop) => {
      const aTime =
        typeof a.lastSeenTs === "number"
          ? a.lastSeenTs
          : a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
      const bTime =
        typeof b.lastSeenTs === "number"
          ? b.lastSeenTs
          : b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;
      return bTime - aTime;
    };
    result.now.sort(sortByLastSeen);
    result.backlog.sort(sortByLastSeen);
    result.other.sort(sortByLastSeen);
    return result;
  }, [loops]);

  const handleAction = async (id: string, action: "complete" | "dismiss") => {
    try {
      setSubmittingId(id);
      setError(null);
      const res = await fetch(`/api/open-loops/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Unable to update item");
      }
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setTimeout(() => {
        onChange?.({ id, action });
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 180);
    } catch (err) {
      console.error("Loop update failed", err);
      setError("Couldn’t update this item right now. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const formatRelative = (value?: number | string) => {
    if (value === null || value === undefined) return null;
    const ts = typeof value === "number" ? value : new Date(value).getTime();
    if (Number.isNaN(ts)) return null;
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const renderGroup = (label: string, items: OpenLoop[]) => {
    if (!items.length) return null;
    return (
      <section key={label} className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        {items.map((loop) => {
          const name =
            loop.displayName ??
            loop.name ??
            (loop.isGroup ? "Group chat" : undefined) ??
            loop.chatId ??
            (loop as any).chat_id ??
            "Unknown chat";

          const relative = formatRelative(loop.lastSeenTs ?? loop.firstSeenTs ?? loop.createdAt);

          const surface = (loop.surfaceType || (loop as any).surface_type || loop.category || "").toString();
          const surfaceLabelMap: Record<string, string> = {
            reply_needed: "Needs reply",
            decision_needed: "Decision needed",
            todo: "To-do",
            follow_up: "Follow-up",
            info_to_save: "Info",
            fallback: "Open loop",
          };
          const surfaceLabel = surfaceLabelMap[surface] || (surface ? surface.replace(/_/g, " ") : "Open loop");

          const metaParts = [surfaceLabel, relative].filter(Boolean);
          const metaLine = metaParts.join(" • ");

          return (
            <article
              key={loop.id}
              className={`loop-card rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-50 ${
                exitingIds.has(loop.id) ? "opacity-0 -translate-y-1" : ""
              }`}
              data-loop-id={loop.id}
              data-loop-category={loop.category}
              data-loop-status={loop.status}
            >
              <header className="loop-header flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="loop-title truncate text-base font-semibold leading-tight text-slate-900">{name}</h3>
                  {metaLine && <div className="loop-meta text-xs text-slate-500">{metaLine}</div>}
                </div>
                <div className="loop-actions flex items-center gap-2 sm:ml-3">
                  <button
                    className="loop-action loop-action-complete inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-800 ring-1 ring-emerald-200 transition hover:scale-105 hover:bg-emerald-200 disabled:opacity-60"
                    onClick={() => handleAction(loop.id, "complete")}
                    disabled={submittingId === loop.id}
                    aria-label="Mark as done"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.01l-3.25-3.2a1 1 0 1 1 1.404-1.424l2.54 2.503 6.55-6.596a1 1 0 0 1 1.42-.007Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    className="loop-action loop-action-dismiss inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-800 ring-1 ring-slate-200 transition hover:scale-105 hover:bg-slate-200 disabled:opacity-60"
                    onClick={() => handleAction(loop.id, "dismiss")}
                    disabled={submittingId === loop.id}
                    aria-label="Mark not important"
                  >
                    ✕
                  </button>
                </div>
              </header>

              <p className="mt-2 text-sm text-slate-800">
                {loop.summary ?? loop.what ?? (loop as any).summary ?? (loop as any).text ?? "Something to follow up on"}
              </p>
            </article>
          );
        })}
      </section>
    );
  };

  const totalLoops = (groups.now?.length || 0) + (groups.backlog?.length || 0) + (groups.other?.length || 0);

  if (!totalLoops) {
    return (
      <div className="flex flex-col items-center justify-center px-2 py-4 text-center text-sm text-slate-700">
        {confetti && (
          <Lottie
            animationData={confetti}
            loop
            autoplay
            className="w-full max-w-md"
          />
        )}
        <p className="mt-2 text-base font-semibold text-slate-900">Well done — you’re all caught up.</p>
        <p className="mt-1 text-xs text-slate-500">Come back later and I’ll surface anything new that needs you.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderGroup("Now", groups.now)}
      {renderGroup("Backlog", groups.backlog)}
      {renderGroup("Other", groups.other)}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
