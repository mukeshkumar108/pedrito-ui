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
  title: "Pedrito",
  description: "Your tiny second brain for messages and open loops.",
  manifest: "/manifest.json",
  themeColor: "#f8f5f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#f8f5f0] text-slate-900`}
      >
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f8f5f0] via-[#f4efe6] to-[#f1ebdf]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,187,146,0.35),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(154,192,205,0.35),transparent_30%)] blur-3xl"
          />
          <main className="relative z-10 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
