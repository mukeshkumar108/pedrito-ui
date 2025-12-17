"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (!signInError) {
        router.replace("/");
        router.refresh();
        return;
      }

      // If sign-in failed (likely first time), create the account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message || "Unable to sign in right now.");
        return;
      }

      // If email confirmations are off, Supabase returns a session we can use immediately
      if (signUpData.session) {
        router.replace("/");
        router.refresh();
        return;
      }

      // Otherwise, try signing in once right after signup (handles instant-access mode)
      const { error: postSignUpSignInError } = await supabase.auth.signInWithPassword({ email, password });
      if (postSignUpSignInError) {
        setError(postSignUpSignInError.message || "Check your inbox to confirm, then sign in.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("Auth failed", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-md bg-white/10 p-6 ring-1 ring-slate-200/30 backdrop-blur">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white">Pedrito</p>
        <p className="text-[1.25em] text-white/80">
          Enter your email and password. If you’re new, we’ll create your account and sign you in right away.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white">Email</label>
          <input
            className="w-full rounded-md border border-white/40 bg-white/80 px-4 py-3 text-[1.25em] text-slate-900 outline-none transition focus:border-[#f4acff] focus:ring-2 focus:ring-[#f4acff]/40"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white">Password</label>
          <input
            className="w-full rounded-md border border-white/40 bg-white/80 px-4 py-3 text-[1.25em] text-slate-900 outline-none transition focus:border-[#f4acff] focus:ring-2 focus:ring-[#f4acff]/40"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="current-password"
            placeholder="At least 6 characters"
          />
        </div>
        {error && <p className="text-xs text-rose-100">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[#f4acff] px-4 py-3 text-[1.25em] font-semibold text-white transition hover:bg-[#f7b8ff] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
