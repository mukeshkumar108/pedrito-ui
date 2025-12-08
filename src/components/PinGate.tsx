"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

type PinStage = "checking" | "setup" | "verify" | "passed";

interface PinGateProps {
  children: ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const [stage, setStage] = useState<PinStage>("checking");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedPin = localStorage.getItem("pedrito-pin");
    const verified = localStorage.getItem("pedrito-pin-verified") === "true";
    if (!storedPin) {
      setStage("setup");
      return;
    }
    if (verified) {
      setStage("passed");
      return;
    }
    setStage("verify");
  }, []);

  const validatePin = (value: string) => /^\d{4,6}$/.test(value);

  const handleSetup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!validatePin(pin)) {
      setError("Use 4–6 digits to keep things simple.");
      return;
    }
    if (pin !== confirmPin) {
      setError("Those two don’t match. Try again.");
      return;
    }
    localStorage.setItem("pedrito-pin", pin);
    localStorage.setItem("pedrito-pin-verified", "true");
    setStage("passed");
  };

  const handleVerify = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const storedPin = localStorage.getItem("pedrito-pin");
    if (pin === storedPin) {
      localStorage.setItem("pedrito-pin-verified", "true");
      setStage("passed");
      return;
    }
    setError("That PIN doesn’t seem right.");
  };

  const resetPin = () => {
    localStorage.removeItem("pedrito-pin");
    localStorage.removeItem("pedrito-pin-verified");
    setPin("");
    setConfirmPin("");
    setError(null);
    setStage("setup");
  };

  if (stage === "passed") {
    return <>{children}</>;
  }

  const overlayTitle =
    stage === "setup"
      ? "Set a PIN to keep your briefings private."
      : "Enter your PIN to unlock Pedrito.";
  const overlayBody =
    stage === "setup"
      ? "Choose a short code you’ll remember. This just keeps wandering eyes away from your daily briefing."
      : "Just a quick check before we open your card.";

  return (
    <div className="relative">
      <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-900/80">Pedrito</p>
            <h1 className="text-2xl font-semibold text-slate-900">{overlayTitle}</h1>
            <p className="text-sm text-slate-600">{overlayBody}</p>
          </div>

          {stage === "checking" && (
            <p className="mt-6 text-sm text-slate-500">Taking a quick peek…</p>
          )}

          {stage === "setup" && (
            <form className="mt-6 space-y-4" onSubmit={handleSetup}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">PIN</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg tracking-[0.3em] text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  minLength={4}
                  autoFocus
                  aria-label="Create a PIN"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Confirm PIN</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg tracking-[0.3em] text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  minLength={4}
                  aria-label="Confirm PIN"
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:bg-emerald-500"
              >
                Save PIN
              </button>
            </form>
          )}

          {stage === "verify" && (
            <form className="mt-6 space-y-4" onSubmit={handleVerify}>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">PIN</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg tracking-[0.3em] text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  minLength={4}
                  autoFocus
                  aria-label="Enter PIN"
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:bg-emerald-500"
              >
                Unlock
              </button>
              <button
                type="button"
                className="w-full text-xs font-semibold text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
                onClick={resetPin}
              >
                Need a new PIN? Reset it
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
