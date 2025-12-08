"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type WhatsappStatus = "connected" | "waiting_qr" | "unknown";

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

interface OnboardingSectionProps {
  onConnected?: () => void;
}

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
  if (normalized.includes("qr") || normalized.includes("pair") || normalized.includes("waiting")) {
    return "waiting_qr";
  }
  return "unknown";
};

export function OnboardingSection({ onConnected }: OnboardingSectionProps) {
  const [status, setStatus] = useState<WhatsappStatus>("unknown");
  const [message, setMessage] = useState<string | null>(null);
  const [rawStatus, setRawStatus] = useState<StatusResponse | null>(null);
  const [qrVersion, setQrVersion] = useState(0);
  const hasAnnouncedConnected = useRef(false);

  const updateStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data: StatusResponse = await res.json();
      setRawStatus(data);
      const nextStatus = interpretWhatsappStatus(data);
      setStatus(nextStatus);
      if (nextStatus === "connected") {
        setMessage(null);
      }
    } catch (error) {
      console.error("Status check failed", error);
      setStatus("unknown");
      setMessage(
        "I’m having trouble reaching WhatsApp right now. The little box running Pedrito might need a nudge."
      );
    }
  }, []);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  useEffect(() => {
    if (status === "waiting_qr") {
      setQrVersion((v) => v + 1);
      const interval = setInterval(() => setQrVersion((v) => v + 1), 15000);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    if (status === "connected" && !hasAnnouncedConnected.current) {
      hasAnnouncedConnected.current = true;
      onConnected?.();
    }
  }, [status, onConnected]);

  const statusLabel = useMemo(() => {
    if (status === "connected") return "You’re linked";
    if (status === "waiting_qr") return "Waiting to link";
    return "Trying to reach WhatsApp";
  }, [status]);

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-950/70 p-6 shadow-xl ring-1 ring-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-200/60">
            Meet Pedrito
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Your tiny assistant for WhatsApp chaos
          </h2>
        </div>
        <span
          className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 ring-1 ring-white/10"
          aria-live="polite"
        >
          {statusLabel}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-200/80">
        Pedrito quietly watches what people ask of you and turns it into a calm
        little list. Right now he’s focused on finding open loops in your recent
        chats — promises, follow-ups, unanswered questions, and time-sensitive
        stuff.
      </p>

      {status === "connected" && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-emerald-500/10 px-4 py-3 text-emerald-100 ring-1 ring-emerald-400/30">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-sm font-semibold">You’re linked</p>
            <p className="text-xs text-emerald-50/80">
              Pedrito is now pulling your recent chats to spot open loops.
            </p>
          </div>
        </div>
      )}

      {status === "waiting_qr" && (
        <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-sm font-semibold text-white">
            Scan this once on your phone
          </p>
          <p className="text-xs text-slate-200/70">
            Point your camera at the code. The code refreshes every little bit,
            so if it looks old, just wait a few seconds.
          </p>
          <div className="mt-4 flex items-center justify-center rounded-xl bg-black/60 p-4 ring-1 ring-white/10">
            <img
              src={`/api/whatsapp/qr?v=${qrVersion}`}
              alt="WhatsApp QR"
              className="h-64 w-64 rounded-lg bg-white p-2 shadow-lg"
            />
          </div>
        </div>
      )}

      {status === "unknown" && (
        <div className="mt-6 rounded-2xl bg-amber-500/10 px-4 py-3 text-amber-100 ring-1 ring-amber-400/30">
          <p className="text-sm font-semibold">Can’t reach WhatsApp</p>
          <p className="text-xs text-amber-50/80">
            I’m having trouble reaching WhatsApp right now. The little box
            running Pedrito might need a quick nudge.
          </p>
        </div>
      )}

      {message && (
        <p className="mt-4 text-xs text-slate-200/70" role="status">
          {message}
        </p>
      )}

      {rawStatus && (
        <details className="mt-4 text-xs text-slate-300/80">
          <summary className="cursor-pointer text-slate-200">Debug: status payload</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all rounded-xl bg-white/10 p-3 text-[11px] text-slate-100">
            {JSON.stringify(rawStatus, null, 2)}
          </pre>
        </details>
      )}
    </section>
  );
}
