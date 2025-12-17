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
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-700">{statusLabel}</h3>
        {status === "connected" && <span className="text-sm text-emerald-600">Linked</span>}
      </div>

      {status === "waiting_qr" && (
        <div className="space-y-3 rounded-md bg-[#8ed462] p-4 text-white">
          <p className="text-base font-semibold text-white">Scan this code once on your phone.</p>
          <p className="text-base text-white/90">
            The code refreshes every few seconds, so if it looks old, just wait a moment.
          </p>
          <div className="flex items-center justify-center">
            <img
              src={`/api/whatsapp/qr?v=${qrVersion}`}
              alt="WhatsApp QR"
              className="h-64 w-64 rounded-md object-contain"
            />
          </div>
          <p className="text-sm text-slate-900">You can disconnect Pedrito at any time.</p>
        </div>
      )}

      {status === "connected" && (
        <div className="space-y-2 rounded-md bg-emerald-500/10 px-4 py-3 text-emerald-800 ring-1 ring-emerald-400/30">
          <p className="text-[1.1em] font-semibold text-slate-700">You’re linked</p>
          <p className="text-sm text-emerald-700">
            Pedrito is now pulling your recent chats to spot open loops.
          </p>
        </div>
      )}

      {status === "unknown" && (
        <div className="space-y-1 rounded-md bg-amber-500/10 px-4 py-3 text-amber-800 ring-1 ring-amber-400/30">
          <p className="text-[1.1em] font-semibold text-slate-700">Can’t reach WhatsApp</p>
          <p className="text-sm text-amber-700">
            I’m having trouble reaching WhatsApp right now. The little box running Pedrito might need a quick nudge.
          </p>
        </div>
      )}

      {message && (
        <p className="text-sm text-slate-700" role="status">
          {message}
        </p>
      )}

      {rawStatus && (
        <details className="text-xs text-slate-600">
          <summary className="cursor-pointer text-slate-800">Debug: status payload</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all rounded-md bg-slate-800/80 p-3 text-[11px] text-white">
            {JSON.stringify(rawStatus, null, 2)}
          </pre>
        </details>
      )}
    </section>
  );
}
