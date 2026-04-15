import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST — URL signée pour qu’un client uploade dans `client-uploads/{client_id}/{uuid}_{filename}`
 * (préfixe UUID pour éviter collisions tout en gardant le dossier client).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: clientRow } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!clientRow?.id) {
    return NextResponse.json(
      { error: "Aucun compte client lié" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const filename = body?.filename as string | undefined;
  if (!filename) {
    return NextResponse.json({ error: "filename requis" }, { status: 400 });
  }

  const safeName = filename.replace(/^\/+/, "").replace(/\.\./g, "");
  const path = `${clientRow.id}/${randomUUID()}_${safeName}`;

  const { data, error } = await supabase.storage
    .from("client-uploads")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("Client signed upload error:", error);
    return NextResponse.json(
      { error: "Impossible de créer l’URL d’upload" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    path,
    signedUrl: data.signedUrl,
    token: data.token,
    client_id: clientRow.id,
  });
}
