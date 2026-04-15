"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Veuillez confirmer votre email avant de vous connecter.";
  if (m.includes("too many requests"))
    return "Trop de tentatives. Réessayez dans quelques instants.";
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const msg = params.get("message");
    const reason = params.get("reason");
    if (err === "auth_callback" && msg) {
      setError(decodeURIComponent(msg));
    } else if (err === "missing_code") {
      setError("Lien invalide ou expiré. Demandez un nouveau lien.");
    }
    if (reason === "invite-only") {
      setInfo(
        "L’inscription publique n’est pas disponible. Votre compte est créé sur invitation par Astra Studio.",
      );
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(mapAuthError(authError.message));
      setLoading(false);
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
          Connexion à votre espace
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[#888888]">
          Accédez à votre tableau de bord et à vos livrables. Les comptes sont
          créés sur invitation — pas d&apos;inscription publique.
        </p>

        {info && (
          <div
            className="mt-6 rounded-[10px] border border-[#d4af37]/25 bg-[#d4af37]/[0.07] px-4 py-3 text-center text-sm text-[#e8d5a3]"
            role="status"
          >
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-xs font-medium uppercase tracking-[0.12em] text-[#888888]"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-xs font-medium uppercase tracking-[0.12em] text-[#888888]"
            >
              Mot de passe
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            className="h-12 w-full rounded-[10px] bg-[#d4af37] text-[15px] font-semibold text-black shadow-[0_8px_24px_-4px_rgba(212,175,55,0.35)] transition-[transform,opacity,box-shadow] duration-200 ease-out hover:bg-[#dfc15a] hover:shadow-[0_12px_28px_-4px_rgba(212,175,55,0.45)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-[#888888] transition-colors duration-200 hover:text-[#d4af37]"
          >
            Mot de passe oublié ?
          </Link>
        </p>
      </div>

      <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-[#555555]">
        Besoin d&apos;un accès ? Contactez Astra Studio — votre espace est activé
        lorsque votre accompagnement commence.
      </p>
    </div>
  );
}
