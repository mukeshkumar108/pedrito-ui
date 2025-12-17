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
          <div className="space-y-5">
            <div className="space-y-2">
              <h1 className="text-[2em] font-bold text-slate-700">Meet Pedrito</h1>
              <p className="text-[2em] font-medium leading-snug text-slate-700 sm:text-[2em]">
                Your quiet second brain for remembering the little things.
              </p>
              <p className="text-[1.1em] leading-[1.3] text-slate-700">
                Ever finish a chat thinking “I’ll reply to that later” — and then forget?
              </p>
              <p className="text-[1.1em] leading-[1.3] text-slate-700">
                Pedrito gently keeps track of things people ask you for, follow-ups you meant to send, and loose ends you didn’t want to drop.
              </p>
            </div>
            <ul className="space-y-2 text-[1.1em] leading-[1.3] text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-emerald-500">✓</span>
                <span>Private and secure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-emerald-500">✓</span>
                <span>No posting, no replies sent</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-emerald-500">✓</span>
                <span>You’re always in control</span>
              </li>
            </ul>
            <div className="flex justify-start">
              <button
                className="rounded-md bg-slate-700 px-5 py-3 text-[1.1em] font-semibold text-white transition hover:bg-slate-600"
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
            <h2 className="text-3xl font-semibold text-slate-700">What should Pedrito focus on for you?</h2>
            <p className="text-[1.1em] leading-[1.3] text-slate-700">Pick as many as you like. You can always change this later.</p>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((label) => {
                const active = preferences.focusesOn.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => selectFocus(label)}
                    className={`rounded-md border px-4 py-3 text-[1.1em] font-semibold transition ${
                      active
                        ? "border-slate-700 bg-slate-700 text-white"
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
                className="text-[1.1em] font-semibold text-slate-700 underline-offset-4 hover:underline"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="rounded-md bg-slate-700 px-5 py-3 text-[1.1em] font-semibold text-white shadow-sm transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-400"
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
            <h2 className="text-3xl font-semibold text-slate-700">How should Pedrito talk to you?</h2>
            <p className="text-[1.1em] leading-[1.3] text-slate-700">We’ll keep the language gentle, but you can pick the vibe.</p>
            <div className="flex flex-wrap gap-2">
              {toneOptions.map((tone) => {
                const active = preferences.tone === tone;
                const label = tone === "surprise" ? "Surprise me" : tone[0].toUpperCase() + tone.slice(1);
                return (
                  <button
                    key={tone}
                    onClick={() => selectTone(tone)}
                    className={`rounded-md border px-4 py-3 text-[1.1em] font-semibold transition ${
                      active
                        ? "border-slate-700 bg-slate-700 text-white"
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
                className="text-[1.1em] font-semibold text-slate-700 underline-offset-4 hover:underline"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="rounded-md bg-slate-700 px-5 py-3 text-[1.1em] font-semibold text-white shadow-sm transition hover:bg-slate-600"
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
            <h2 className="text-3xl font-semibold text-slate-700">How often should Pedrito check in?</h2>
            <p className="text-[1.1em] leading-[1.3] text-slate-700">You’ll always be able to open him any time — nudges are optional.</p>
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
                    className={`w-full rounded-md border px-4 py-3 text-left text-[1.1em] font-semibold transition sm:w-auto ${
                      active
                        ? "border-slate-700 bg-slate-700 text-white"
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
                className="text-[1.1em] font-semibold text-slate-700 underline-offset-4 hover:underline"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                className="rounded-md bg-slate-700 px-5 py-3 text-[1.1em] font-semibold text-white shadow-sm transition hover:bg-slate-600"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-5">
            <div className="space-y-3 rounded-lg bg-white/80 p-4">
              <h2 className="text-3xl font-semibold text-slate-700">Last step: connect WhatsApp</h2>
              <div className="space-y-2 text-[1.1em] leading-[1.3] text-slate-700">
                <p>To do his job, Pedrito needs a private link to your WhatsApp.</p>
                <p>He doesn’t send messages. He doesn’t post on your behalf. He doesn’t share your chats.</p>
                <p>He quietly looks for things like:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>messages that need a reply</li>
                  <li>promises you made</li>
                  <li>follow-ups and time-sensitive asks</li>
                </ul>
                <p>…and turns them into a calm little list you can check when it suits you.</p>
                <p className="font-semibold text-slate-800">
                  Think of Pedrito like a second set of eyes — noticing the things you already care about, so you don’t have to hold them all in your head.
                </p>
              </div>
            </div>
            <OnboardingSection
              onConnected={() => {
                if (!connected) {
                  handleConnected();
                }
              }}
            />
            <div className="flex justify-start">
              <button
                className="text-[1.1em] font-semibold text-slate-700 underline-offset-4 hover:underline"
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
    <div className="w-full">
      <div className="rounded-lg border border-slate-200/60 bg-white p-6 sm:p-8">
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
