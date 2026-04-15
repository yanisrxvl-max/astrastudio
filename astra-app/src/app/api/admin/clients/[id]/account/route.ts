import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Dernière connexion du compte utilisateur lié au client (admin uniquement). */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: client, error } = await admin
    .from("clients")
    .select("user_id, email")
    .eq("id", params.id)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  if (!client.user_id) {
    return NextResponse.json({
      has_account: false,
      last_sign_in_at: null,
      email: client.email,
    });
  }

  const { data: authUser, error: authErr } =
    await admin.auth.admin.getUserById(client.user_id);

  if (authErr || !authUser.user) {
    return NextResponse.json({
      has_account: true,
      last_sign_in_at: null,
      email: client.email,
    });
  }

  return NextResponse.json({
    has_account: true,
    last_sign_in_at: authUser.user.last_sign_in_at ?? null,
    email: authUser.user.email ?? client.email,
  });
}
