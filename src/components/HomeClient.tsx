"use client";

import { useEffect, useMemo, useState } from "react";
import { PedritoCard } from "@/components/PedritoCard";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function HomeClient() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const supabase = useMemo(() => createSupabaseClient(), []);
  const router = useRouter();

  useEffect(() => {
    const storedComplete =
      localStorage.getItem("pedrito_onboarding_complete") === "true" ||
      localStorage.getItem("pedrito-onboarded") === "true";
    setOnboardingComplete(storedComplete);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (onboardingComplete) {
      localStorage.setItem("pedrito_onboarding_complete", "true");
      localStorage.setItem("pedrito-onboarded", "true");
    }
  }, [onboardingComplete]);

  const handleConnected = () => {
    setWhatsappConnected(true);
    setOnboardingComplete(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  };

  if (!hydrated) return null;

  return (
    <main className="min-h-screen bg-[#f7f7f7]">
      <div className="mx-auto flex max-w-3xl items-start justify-between px-4 pt-6 pb-2 sm:pt-10 lg:pt-12">
        <div className="text-sm font-semibold text-slate-800">Pedrito</div>
        <button
          onClick={handleSignOut}
          className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-white"
        >
          Sign out
        </button>
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-12 sm:pb-14">
        {onboardingComplete ? (
          <PedritoCard />
        ) : (
          <OnboardingWizard onConnected={handleConnected} onComplete={handleConnected} />
        )}
      </div>
    </main>
  );
}
