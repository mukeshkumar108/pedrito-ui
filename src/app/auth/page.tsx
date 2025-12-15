import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthForm } from "@/components/AuthForm";

export default async function AuthPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#0b0c10] text-white">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex items-center px-6 py-12 sm:px-10 lg:px-16">
          <AuthForm />
        </div>
        <div className="hidden md:block">
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black">
            <div className="mx-10 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                Why Pedrito
              </p>
              <h2 className="text-3xl font-semibold text-white">
                Keep every promise, follow-up, and question in one calm lane.
              </h2>
              <ul className="space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                  Pedrito scans your chats and surfaces the asks that need your time.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                  Clear them quickly with Done or Not important—no noisy inbox.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                  Daily digest so you know what’s waiting before the day starts.
                </li>
              </ul>
              <div className="h-32 w-full rounded-2xl bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_40%,rgba(79,70,229,0.16),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.14),transparent_35%)]" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
