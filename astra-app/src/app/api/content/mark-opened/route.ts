import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Première ouverture du pack par le client → opened_at (badge « Nouveau »).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const packId = body?.pack_id as string | undefined;
  if (!packId) {
    return NextResponse.json({ error: "pack_id requis" }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: pack } = await supabase
    .from("content_packs")
    .select("id, client_id, opened_at")
    .eq("id", packId)
    .single();

  if (!pack || pack.client_id !== client.id) {
    return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });
  }

  if (pack.opened_at) {
    return NextResponse.json({ success: true, already: true });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("content_packs")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", packId)
    .is("opened_at", null);

  if (error) {
    console.error("mark-opened:", error);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
