import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook Supabase (optionnel) — ex. Database Webhooks ou Auth hooks.
 * Vérifiez la signature côté production (secret dans les variables d’environnement).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  const sig = request.headers.get("x-supabase-signature");

  if (secret && sig !== secret) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    console.info("[webhooks/supabase]", payload?.type ?? "event");
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
