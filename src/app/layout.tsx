import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pedrito | Calm WhatsApp check-in",
  description:
    "Pedrito is a tiny assistant that turns your WhatsApp chaos into a calm daily checklist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-950 text-slate-50`}
      >
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_25%)]"
          />
          <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
            <div className="w-full max-w-6xl rounded-[28px] border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[24px] bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-black/80 p-6 sm:p-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
