"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [required, setRequired] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setRequired(user?.user_metadata?.must_change_password === true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          {required ? "Définissez votre mot de passe" : "Nouveau mot de passe"}
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[#888888]">
          {required
            ? "Pour sécuriser votre espace, choisissez un mot de passe personnel. Il remplacera le mot de passe temporaire envoyé par email."
            : "Choisissez un mot de passe sécurisé pour votre compte."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="new-password"
              className="block text-xs font-medium uppercase tracking-[0.12em] text-[#888888]"
            >
              Nouveau mot de passe
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="Au moins 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="block text-xs font-medium uppercase tracking-[0.12em] text-[#888888]"
            >
              Confirmation
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Répétez le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
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

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-[10px] bg-[#d4af37] text-[15px] font-semibold text-black shadow-[0_8px_24px_-4px_rgba(212,175,55,0.35)] transition-[transform,opacity,box-shadow] duration-200 ease-out hover:bg-[#dfc15a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Enregistrement…" : "Enregistrer et continuer"}
          </button>
        </form>

        {!required && (
          <p className="mt-8 text-center text-sm">
            <Link
              href="/dashboard"
              className="text-[#888888] transition-colors duration-200 hover:text-[#d4af37]"
            >
              Retour au tableau de bord
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
