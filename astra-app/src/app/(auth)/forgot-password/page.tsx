"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/update-password")}`;

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo },
    );

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setMessage(
      "Si un compte existe pour cet email, vous recevrez un lien de réinitialisation.",
    );
  }

  const inputClass =
    "h-12 w-full rounded-[10px] border border-white/[0.08] bg-[#0a0a0a] px-4 text-[15px] text-white shadow-inner placeholder:text-[#555] transition-[border-color,box-shadow] duration-200 ease-out focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20";

  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-8 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] sm:p-10">
        <div className="flex justify-center">
          <Image
            src="/images/astra-logo.svg"
            alt="Astra Studio"
            width={200}
            height={56}
            priority
            className="h-12 w-auto"
          />
        </div>

        <h1 className="mt-8 text-center text-[1.35rem] font-semibold tracking-tight text-white">
          Mot de passe oublié
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[#888888]">
          Indiquez votre email : nous vous envoyons un lien pour choisir un
          nouveau mot de passe.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="forgot-email"
              className="block text-xs font-medium uppercase tracking-[0.12em] text-[#888888]"
            >
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          {error && (
            <div
              className="rounded-[10px] border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95"
              role="alert"
            >
              {error}
            </div>
          )}
          {message && (
            <div
              className="rounded-[10px] border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-200/95"
              role="status"
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-[10px] bg-[#d4af37] text-[15px] font-semibold text-black shadow-[0_8px_24px_-4px_rgba(212,175,55,0.35)] transition-opacity hover:bg-[#dfc15a] disabled:opacity-50"
          >
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm">
          <Link
            href="/login"
            className="text-[#888888] transition-colors duration-200 hover:text-[#d4af37]"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
