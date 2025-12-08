"use client";

import { useMemo, useState } from "react";

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
  who?: string;
  what?: string;
  when?: string | null;
  category?: OpenLoopCategory;
  status?: OpenLoopStatus;
  createdAt?: string;
}

interface OpenLoopsListProps {
  loops: OpenLoop[];
  onChange?: () => void;
}

const categoryLabel: Record<string, string> = {
  promise: "Promise",
  follow_up: "Follow-up",
  question: "Question",
  time_sensitive: "Time-sensitive",
};

function formatDate(dateString?: string) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeAgo(dateInput?: string) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function OpenLoopsList({ loops, onChange }: OpenLoopsListProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderedLoops = useMemo(() => {
    if (!loops?.length) return [];
    return [...loops].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
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
      onChange?.();
    } catch (err) {
      console.error("Loop update failed", err);
      setError("Couldn’t update this item right now. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (!orderedLoops?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 shadow-inner">
        You don’t owe anyone anything right now. If someone asks for something, it will appear here
        for tomorrow’s check-in.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orderedLoops.map((loop) => {
        const meta: string[] = [];
        if (loop.who) meta.push(loop.who);
        if (loop.category) meta.push(categoryLabel[loop.category] ?? "Open loop");
        const dateLabel = formatDate(loop.createdAt);
        if (dateLabel) meta.push(dateLabel);
        if (loop.when) meta.push(`when: ${loop.when}`);

        return (
          <div
            key={loop.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <p className="text-base font-medium text-slate-900">{loop.what || "Something to follow up on"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400/70">
              {timeAgo(loop.createdAt) && <span>{timeAgo(loop.createdAt)}</span>}
              {meta.length > 0 && <span className="text-slate-500">{meta.join(" • ")}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-200"
                onClick={() => handleAction(loop.id, "complete")}
                disabled={submittingId === loop.id}
              >
                ✅ Done
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-200"
                onClick={() => handleAction(loop.id, "dismiss")}
                disabled={submittingId === loop.id}
              >
                ✕ Not important
              </button>
            </div>
          </div>
        );
      })}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
