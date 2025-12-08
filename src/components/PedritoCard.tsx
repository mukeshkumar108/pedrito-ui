"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OpenLoop, OpenLoopsList } from "./OpenLoopsList";

type PedritoState = "onboarding" | "connect_whatsapp" | "connecting" | "digest" | "disconnected";

type WhatsappStatus = "connected" | "waiting_qr" | "connecting" | "disconnected" | "unknown";

type StatusResponse = {
  status?: string;
  state?: string;
  connectionState?: string;
  connection_state?: string;
  connected?: boolean;
  isAuthenticated?: boolean;
  authenticated?: boolean;
  ready?: boolean;
  [key: string]: unknown;
};

type DigestSummary = {
  narrativeSummary?: string;
  keyPeople?: string[];
  keyTopics?: string[];
};

type DigestResponse = {
  summary?: DigestSummary;
};

const interpretWhatsappStatus = (data: StatusResponse | null): WhatsappStatus => {
  if (!data || typeof data !== "object") return "unknown";
  if (data.connected === true || data.isAuthenticated === true || data.authenticated === true || data.ready === true) {
    return "connected";
  }
  const raw =
    (typeof data.status === "string" && data.status) ||
    (typeof data.state === "string" && data.state) ||
    (typeof data.connectionState === "string" && data.connectionState) ||
    (typeof data.connection_state === "string" && data.connection_state) ||
    (typeof data.status === "object" &&
      data.status &&
      typeof (data.status as { state?: string }).state === "string" &&
      (data.status as { state?: string }).state) ||
    "";
  const normalized = raw.toLowerCase();
  if (normalized.includes("connected")) return "connected";
  if (normalized.includes("qr") || normalized.includes("pair") || normalized.includes("waiting")) return "waiting_qr";
  if (normalized.includes("connecting") || normalized.includes("sync")) return "connecting";
  if (normalized.includes("disconnected") || normalized.includes("logout") || normalized.includes("logged_out")) {
    return "disconnected";
  }
  return "unknown";
};

function viewFromStatus(status: WhatsappStatus): PedritoState {
  if (status === "connected") return "digest";
  if (status === "connecting") return "connecting";
  if (status === "waiting_qr") return "connect_whatsapp";
  if (status === "disconnected") return "disconnected";
  return "connect_whatsapp";
}

export function PedritoCard() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [view, setView] = useState<PedritoState>("onboarding");
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsappStatus>("unknown");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [qrVersion, setQrVersion] = useState(0);
  const [loops, setLoops] = useState<OpenLoop[]>([]);
  const [digest, setDigest] = useState<DigestSummary | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const hasLoadedDigest = useRef(false);
  const todayLabel = useMemo(() => {
    const now = new Date();
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(now);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("pedrito-onboarded") === "true";
    setHasOnboarded(stored);
    setView(stored ? "connect_whatsapp" : "onboarding");
  }, []);

  const updateStatus = useCallback(
    async (force = false) => {
      if (!hasOnboarded && !force) return;
      try {
        setRefreshingStatus(true);
        setStatusMessage(null);
        const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data: StatusResponse = await res.json();
        const nextStatus = interpretWhatsappStatus(data);
        setWhatsappStatus(nextStatus);
        setView((prev) => {
          if (!hasOnboarded && !force) return prev;
          return viewFromStatus(nextStatus);
        });
      } catch (error) {
        console.error("Status check failed", error);
        setWhatsappStatus("unknown");
        setStatusMessage(
          "I’m having trouble reaching WhatsApp right now. The little box running Pedrito might need a nudge."
        );
      } finally {
        setRefreshingStatus(false);
      }
    },
    [hasOnboarded]
  );

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

  const refreshData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      await Promise.all([fetchDigest(), fetchLoops()]);
      hasLoadedDigest.current = true;
    } catch (error) {
      console.error("Data fetch failed", error);
      setDataError("Having trouble loading your briefing. Please refresh.");
    } finally {
      setLoadingData(false);
    }
  }, [fetchDigest, fetchLoops]);

  useEffect(() => {
    if (!hasOnboarded) return;
    updateStatus();
    const interval = setInterval(() => {
      void updateStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [hasOnboarded, updateStatus]);

  useEffect(() => {
    if (view !== "connect_whatsapp") return;
    setQrVersion((v) => v + 1);
    const interval = setInterval(() => setQrVersion((v) => v + 1), 15000);
    return () => clearInterval(interval);
  }, [view]);

  useEffect(() => {
    if (view !== "digest") return;
    if (hasLoadedDigest.current) return;
    refreshData();
  }, [view, refreshData]);

  useEffect(() => {
    if (view !== "digest") {
      hasLoadedDigest.current = false;
    }
  }, [view]);

  const handleOnboardingContinue = () => {
    localStorage.setItem("pedrito-onboarded", "true");
    setHasOnboarded(true);
    setView("connect_whatsapp");
    void updateStatus(true);
  };

  const handleReconnect = () => {
    setView("connect_whatsapp");
    void updateStatus(true);
  };

  const counts = useMemo(() => {
    const base = {
      promise: 0,
      follow_up: 0,
      question: 0,
      time_sensitive: 0,
    };
    loops.forEach((loop) => {
      const categoryKey = loop.category as keyof typeof base;
      if (categoryKey && categoryKey in base) {
        base[categoryKey] += 1;
      }
    });
    return base;
  }, [loops]);

  const statusLabel = useMemo(() => {
    if (view === "digest") return "Linked to WhatsApp";
    if (view === "connecting") return "Linking...";
    if (view === "connect_whatsapp") return "Waiting to link";
    if (view === "disconnected") return "Link lost";
    return "Just getting started";
  }, [view]);

  const renderBadge = (
    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      {statusLabel}
    </div>
  );

  const loadingIndicator = (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
      Checking in with Pedrito…
    </div>
  );

  return (
    <div className="relative w-full">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full rounded-3xl border border-white/60 bg-white/70 shadow-2xl shadow-emerald-100/40 backdrop-blur-xl">
          <div className="h-full w-full rounded-[26px] border border-white/70 bg-white/80 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800/70">
                  Pedrito
                </p>
                <p className="text-sm text-slate-500">
                  A tiny companion who keeps your promises and follow-ups in one calm place.
                </p>
              </div>
              {renderBadge}
            </div>

            <div className="mt-6">
              {view === "onboarding" && (
                <div className="space-y-4">
                  <h1 className="text-3xl font-semibold text-slate-900">
                    Welcome to your second brain.
                  </h1>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Pedrito quietly watches your incoming communications and picks out the tiny
                    bits humans actually care about — promises, follow-ups, invitations and
                    questions. Each day, he gives you a small, calm checklist so nothing important
                    has to live in your head.
                  </p>
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:bg-emerald-500"
                    onClick={handleOnboardingContinue}
                  >
                    Let’s get started →
                  </button>
                </div>
              )}

              {view === "connect_whatsapp" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold text-slate-900">Connect WhatsApp</h1>
                    <p className="text-sm text-slate-600">
                      To begin, Pedrito needs your WhatsApp link. He uses this to spot the
                      important things hiding in your recent conversations.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                    <p className="text-sm font-semibold text-slate-800">
                      Scan this once on your phone
                    </p>
                    <p className="text-xs text-slate-500">
                      I’m asking WhatsApp for your code… it should appear here soon.
                    </p>
              <div className="mt-4 flex items-center justify-center rounded-xl bg-slate-50 p-4">
                  <img
                    src={`/api/whatsapp/qr?v=${qrVersion}`}
                    alt="WhatsApp QR"
                    className="h-64 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                  />
              </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p>
                        On your phone, open WhatsApp → Settings → Linked Devices → Link a Device,
                        then point your camera at this code.
                      </p>
                      <p>The code refreshes from time to time, so if it changes just scan again.</p>
                    </div>
                  </div>
                  {statusMessage && (
                    <p className="text-xs text-rose-500" role="status">
                      {statusMessage}
                    </p>
                  )}
                  {refreshingStatus && loadingIndicator}
                </div>
              )}

              {view === "connecting" && (
                <div className="space-y-4">
                  <h1 className="text-3xl font-semibold text-slate-900">Pedrito is waking up…</h1>
                  <p className="text-sm leading-relaxed text-slate-600">
                    He’s setting up his little antenna, organising your recent chats, and getting
                    your first daily briefing ready. This only takes a moment.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                    <span className="h-2 w-2 animate-ping rounded-full bg-emerald-300 delay-150" />
                    <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400 delay-300" />
                    <span className="text-xs text-slate-500">Pedrito is getting settled…</span>
                  </div>
                </div>
              )}

              {view === "digest" && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h1 className="text-lg font-semibold text-slate-900">Today with Pedrito</h1>
                      <p className="text-xs text-slate-500">Looking at the last 24 hours of your WhatsApp chats.</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      <span>{todayLabel}</span>
                      <span>·</span>
                      <span>{whatsappStatus === "connected" ? "WhatsApp linked" : "Not linked"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
                      Today at a glance
                    </span>
                    {loadingData && loadingIndicator}
                    {!loadingData && (
                      <button
                        className="text-xs font-semibold text-emerald-700 underline-offset-4 hover:underline"
                        onClick={refreshData}
                      >
                        Refresh briefing
                      </button>
                    )}
                    {!loadingData && (
                      <p className="text-[11px] text-slate-500">
                        Pulls the latest messages from WhatsApp and updates today’s counts.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">What people have asked of you in the last 24 hours.</p>
                    <div className="flex flex-wrap gap-2">
                      <DigestChip label="Promises" value={counts.promise} />
                      <DigestChip label="Follow-ups" value={counts.follow_up} />
                      <DigestChip label="Questions" value={counts.question} />
                      <DigestChip label="Time-sensitive" value={counts.time_sensitive} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-slate-900">Things waiting on you</h2>
                    <p className="text-xs text-slate-500">
                      These are the promises, questions and follow-ups Pedrito has parked for you. Mark anything as Done or Not important to clear it from your plate.
                    </p>
                  </div>

                  <OpenLoopsList loops={loops} onChange={fetchLoops} />

                  {dataError && (
                    <p className="text-xs text-rose-500">
                      I couldn’t load your briefing just now. Hit ‘Refresh briefing’ to try again.
                    </p>
                  )}

                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-800">
                    On your phone, you can add Pedrito to your home screen for one-tap access.
                  </div>
                </div>
              )}

              {view === "disconnected" && (
                <div className="space-y-4">
                  <h1 className="text-3xl font-semibold text-slate-900">
                    Oops, Pedrito lost his link to WhatsApp.
                  </h1>
                  <p className="text-sm text-slate-600">
                    This sometimes happens when WhatsApp revokes old links. Let’s reconnect so he
                    can keep helping.
                  </p>
                  <button
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:bg-emerald-500"
                    onClick={handleReconnect}
                  >
                    Reconnect WhatsApp
                  </button>
                  {statusMessage && <p className="text-xs text-rose-500">{statusMessage}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DigestChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
      <span>{label}</span>
      <span className="rounded-full bg-slate-900 px-2 py-1 text-white">{value}</span>
    </div>
  );
}
