"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { OnboardingSection } from "./OnboardingSection";

type PedritoPreferences = {
  focusesOn: string[];
  tone: "calm" | "playful" | "direct" | "soft" | "surprise";
  cadence: "daily" | "new_only" | "weekly" | "none";
};

const focusOptions = [
  "Promises",
  "Follow-ups",
  "Unanswered questions",
  "Time-sensitive things",
  "Small tasks",
  "Invitations and plans",
];

const toneOptions: PedritoPreferences["tone"][] = [
  "calm",
  "playful",
  "direct",
  "soft",
  "surprise",
];

const cadenceOptions: PedritoPreferences["cadence"][] = [
  "daily",
  "new_only",
  "weekly",
  "none",
];

interface OnboardingWizardProps {
  onConnected: () => void;
  onComplete: () => void;
}

export function OnboardingWizard({ onConnected, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [connected, setConnected] = useState(false);
  const [preferences, setPreferences] = useState<PedritoPreferences>({
    focusesOn: [focusOptions[0]],
    tone: "calm",
    cadence: "daily",
  });

  useEffect(() => {
    const storedPrefs = localStorage.getItem("pedrito_prefs");
    if (storedPrefs) {
      try {
        const parsed = JSON.parse(storedPrefs) as PedritoPreferences;
        setPreferences({
          focusesOn: parsed.focusesOn?.length ? parsed.focusesOn : [focusOptions[0]],
          tone: parsed.tone || "calm",
          cadence: parsed.cadence || "daily",
        });
      } catch (error) {
        console.error("Failed to parse stored preferences", error);
      }
    }
  }, []);

  const canContinue = useMemo(() => {
    if (step === 1) return preferences.focusesOn.length > 0;
    return true;
  }, [preferences.focusesOn.length, step]);

  const persist = (prefs: PedritoPreferences) => {
    localStorage.setItem("pedrito_prefs", JSON.stringify(prefs));
  };

  const handleNext = () => {
    if (!canContinue) return;
    if (step >= 4) return;
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const selectFocus = (label: string) => {
    setPreferences((prev) => {
      const exists = prev.focusesOn.includes(label);
      const nextFocuses = exists
        ? prev.focusesOn.filter((f) => f !== label)
        : [...prev.focusesOn, label];
      const next = { ...prev, focusesOn: nextFocuses.length ? nextFocuses : [] };
      persist(next);
      return next;
    });
  };

  const selectTone = (tone: PedritoPreferences["tone"]) => {
    setPreferences((prev) => {
      const next = { ...prev, tone };
      persist(next);
      return next;
    });
  };

  const selectCadence = (cadence: PedritoPreferences["cadence"]) => {
    setPreferences((prev) => {
      const next = { ...prev, cadence };
      persist(next);
      return next;
    });
  };

  const handleConnected = () => {
    const finalPrefs = { ...preferences };
    persist(finalPrefs);
    localStorage.setItem("pedrito_onboarding_complete", "true");
    localStorage.setItem("pedrito-onboarded", "true");
    setConnected(true);
    onConnected();
    onComplete();
  };

  const stepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">Meet Pedrito</h1>
            <p className="text-sm text-slate-600">
              A tiny second brain that keeps track of things people ask you for, so nothing slips
              through the cracks.
            </p>
            <div className="flex justify-end">
              <button
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                onClick={handleNext}
              >
                Get started
              </button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">What should Pedrito focus on for you?</h2>
            <p className="text-sm text-slate-600">Pick as many as you like. You can always change this later.</p>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((label) => {
                const active = preferences.focusesOn.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => selectFocus(label)}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between">
              <button
                className="text-sm font-semibold text-slate-600 underline-offset-4 hover:underline"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={handleNext}
                disabled={!canContinue}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">How should Pedrito talk to you?</h2>
            <p className="text-sm text-slate-600">We’ll keep the language gentle, but you can pick the vibe.</p>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((tone) => {
                const active = preferences.tone === tone;
                const label = tone === "surprise" ? "Surprise me" : tone[0].toUpperCase() + tone.slice(1);
                return (
                  <button
                    key={tone}
                    onClick={() => selectTone(tone)}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between">
              <button
                className="text-sm font-semibold text-slate-600 underline-offset-4 hover:underline"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">How often should Pedrito check in?</h2>
            <p className="text-sm text-slate-600">You’ll always be able to open him any time — nudges are optional.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {cadenceOptions.map((cadence) => {
                const active = preferences.cadence === cadence;
                const labelMap: Record<PedritoPreferences["cadence"], string> = {
                  daily: "Daily summary",
                  new_only: "Only when there’s something new",
                  weekly: "Weekly catch-up",
                  none: "Never — I’ll open him when I want to",
                };
                return (
                  <button
                    key={cadence}
                    onClick={() => selectCadence(cadence)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition sm:w-auto ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {labelMap[cadence]}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between">
              <button
                className="text-sm font-semibold text-slate-600 underline-offset-4 hover:underline"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Last step: connect WhatsApp</h2>
            <p className="text-sm text-slate-600">
              To do his job, Pedrito needs a private link to your WhatsApp. He doesn’t send messages
              or share your chats. He quietly looks for promises, follow-ups and time-sensitive
              things and puts them on your list.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <OnboardingSection
                onConnected={() => {
                  if (!connected) {
                    handleConnected();
                  }
                }}
              />
            </div>
            <div className="flex justify-start">
              <button
                className="text-sm font-semibold text-slate-600 underline-offset-4 hover:underline"
                onClick={handleBack}
              >
                Back
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-lg sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {stepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
