import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST — URL signée pour upload admin vers le bucket `content-delivery`.
 * Chemin : {client_id}/{pack_id}/{filename}
 */
export async function POST(request: NextRequest) {
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
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const clientId = body?.client_id as string | undefined;
  const packId = body?.pack_id as string | undefined;
  const filename = body?.filename as string | undefined;

  if (!clientId || !packId || !filename) {
    return NextResponse.json(
      { error: "client_id, pack_id et filename requis" },
      { status: 400 },
    );
  }

  const safeName = filename.replace(/^\/+/, "").replace(/\.\./g, "");
  const path = `${clientId}/${packId}/${safeName}`;

  const { data, error } = await supabase.storage
    .from("content-delivery")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("Signed upload URL error:", error);
    return NextResponse.json(
      { error: "Impossible de créer l’URL d’upload" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    path,
    signedUrl: data.signedUrl,
    token: data.token,
  });
}
