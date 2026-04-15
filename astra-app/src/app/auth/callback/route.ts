import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Échange le code PKCE Supabase (lien email confirmation / reset MDP) contre une session.
 * Prévenir les open redirects : `next` doit être un chemin relatif interne.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/dashboard";
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("auth callback:", error.message);
    return NextResponse.redirect(
      new URL(
        `/login?error=auth_callback&message=${encodeURIComponent(error.message)}`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
