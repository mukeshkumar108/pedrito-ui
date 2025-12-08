"use client";

import { PedritoCard } from "@/components/PedritoCard";
import { PinGate } from "@/components/PinGate";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(119,173,143,0.3),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(255,189,131,0.35),transparent_30%)] blur-3xl"
      />
      <div className="relative z-10 w-full">
        <PinGate>
          <PedritoCard />
        </PinGate>
      </div>
    </div>
  );
}
