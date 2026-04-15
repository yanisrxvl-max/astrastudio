import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Suppression d’un envoi client (fichier Storage + ligne). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("client_uploads")
    .select("id, client_id, file_url")
    .eq("id", id)
    .single();

  if (!row) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isOwner = client?.id === row.client_id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const admin = createAdminClient();
  await admin.storage.from("client-uploads").remove([row.file_url]);
  const { error: delErr } = await admin
    .from("client_uploads")
    .delete()
    .eq("id", id);

  if (delErr) {
    console.error("client_uploads delete:", delErr);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
