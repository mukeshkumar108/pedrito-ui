"use client";

import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/DashboardSection";
import { OnboardingSection } from "@/components/OnboardingSection";

type StatusResponse = {
  status?: string;
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
        if (!res.ok) return;
        const data: StatusResponse = await res.json();
        if (data.status === "connected") {
          setConnected(true);
        }
      } catch (error) {
        console.error("Initial status check failed", error);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-blue-200/60">
            Pedrito · WhatsApp companion
          </p>
          <h1 className="text-3xl font-semibold text-white">A calm daily check-in</h1>
          <p className="text-sm text-slate-200/80">
            Pedrito spots open loops in your chats and turns them into a gentle checklist.
          </p>
        </div>
        <div className="hidden text-sm text-slate-200/70 sm:block">
          {connected ? "Linked to WhatsApp" : checking ? "Checking connection..." : "Not linked yet"}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.3fr]">
        <OnboardingSection onConnected={() => setConnected(true)} />
        {connected ? (
          <DashboardSection />
        ) : (
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/60 via-slate-900/70 to-slate-950/70 p-7 shadow-2xl ring-1 ring-white/5">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-200/60">
                What Pedrito will do
              </p>
              <h2 className="text-2xl font-semibold text-white">
                A tiny assistant for your promises and follow-ups
              </h2>
              <p className="text-sm text-slate-200/80">
                Once you link WhatsApp, Pedrito will look for promises, follow-ups and
                unanswered questions so nothing slips through.
              </p>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-100/80">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-base">✨</span>
                <span>Spot promises, follow-ups and unanswered questions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-base">🧘‍♂️</span>
                <span>Turn them into a short list of things people might be waiting on.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-base">⏳</span>
                <span>Roll anything still open into tomorrow, so nothing important slips.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-base">🌱</span>
                <span>
                  He’s still small and learning. Marking things as Done or Not important teaches
                  him what matters to you.
                </span>
              </li>
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
