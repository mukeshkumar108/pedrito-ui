"use client";

import { useEffect, useState } from "react";

type QrRawResponse = { raw?: string; length?: number; error?: string };
type QrProxyResponse = { qr?: string; length?: number; error?: string };

const normalizeQr = (qr: string | null | undefined) => {
  if (!qr) return "";
  const trimmed = qr.trim();
  const base64Part = trimmed.replace(/^data:[^,]+,/, "");
  return `data:image/png;base64,${base64Part}`;
};

const bufferToBase64 = (buffer: ArrayBuffer) => {
  if (!buffer || buffer.byteLength === 0) return "";
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export default function QrDebugPage() {
  const [raw, setRaw] = useState<string | null>(null);
  const [rawLength, setRawLength] = useState<number | null>(null);
  const [proxied, setProxied] = useState<string | null>(null);
  const [proxiedLength, setProxiedLength] = useState<number | null>(null);
  const [statusPayload, setStatusPayload] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [rawRes, proxRes, statusRes] = await Promise.all([
          fetch("/api/whatsapp/qr-raw", { cache: "no-store" }),
          fetch("/api/whatsapp/qr", { cache: "no-store" }),
          fetch("/api/whatsapp/status", { cache: "no-store" }),
        ]);

        const rawJson: QrRawResponse = await rawRes.json();
        const proxArrayBuffer = await proxRes.arrayBuffer();
        const proxBase64 = bufferToBase64(proxArrayBuffer);
        const statusJson = await statusRes.json();

        setRaw(typeof rawJson.raw === "string" ? rawJson.raw : null);
        setRawLength(typeof rawJson.length === "number" ? rawJson.length : null);
        setProxied(proxBase64);
        setProxiedLength(proxBase64 ? proxBase64.length : null);
        setStatusPayload(statusJson);

        if (rawJson.error) {
          setError(rawJson.error);
        } else if (statusJson?.error) {
          setError(statusJson.error);
        }
      } catch (err) {
        console.error("qr-debug load error", err);
        setError("Failed to load debug data");
      }
    };

    void load();
  }, []);

  const match =
    raw && proxied
      ? raw.trim().replace(/^data:[^,]+,/, "") === proxied.trim().replace(/^data:[^,]+,/, "")
      : null;

  const renderPreview = (label: string, value: string | null) => (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {value ? (
        <img
          src={normalizeQr(value)}
          alt={`${label} QR`}
          className="h-64 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        />
      ) : (
        <div className="flex h-64 w-64 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
          No data
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f5f0] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
        <h1 className="text-2xl font-semibold text-slate-900">QR Debug</h1>
        <p className="text-sm text-slate-600">
          Compare raw vs proxied QR outputs and current WhatsApp status.
        </p>

        {error && <p className="mt-4 text-sm text-rose-600">Error: {error}</p>}

        <div className="mt-6 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <p className="font-semibold">Lengths</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>Raw length: {rawLength ?? "—"}</li>
              <li>Proxied length: {proxiedLength ?? "—"}</li>
              <li>Raw === Proxied: {match === null ? "—" : match ? "Yes" : "No"}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <p className="font-semibold">First 80 chars</p>
            <p className="mt-2 text-xs break-all">
              Raw: {raw ? raw.slice(0, 80) : "—"}
              {raw && raw.length > 80 ? "…" : ""}
            </p>
            <p className="mt-2 text-xs break-all">
              Proxied: {proxied ? proxied.slice(0, 80) : "—"}
              {proxied && proxied.length > 80 ? "…" : ""}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {renderPreview("Raw", raw)}
          {renderPreview("Proxied", proxied)}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Status payload</p>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-50 p-3 text-[11px] text-slate-700">
            {JSON.stringify(statusPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
