import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Marque un fichier comme téléchargé par le client ; si tous le sont, pack → downloaded.
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
  const fileId = body?.file_id as string | undefined;
  if (!fileId) {
    return NextResponse.json({ error: "file_id requis" }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: fileRow } = await supabase
    .from("content_files")
    .select("id, pack_id")
    .eq("id", fileId)
    .single();

  if (!fileRow) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const { data: pack } = await supabase
    .from("content_packs")
    .select("id, client_id, status")
    .eq("id", fileRow.pack_id)
    .single();

  if (!pack || pack.client_id !== client.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (pack.status === "preparing") {
    return NextResponse.json({ error: "Pack non disponible" }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  await admin
    .from("content_files")
    .update({ client_downloaded_at: now })
    .eq("id", fileId)
    .is("client_downloaded_at", null);

  const { data: allFiles } = await admin
    .from("content_files")
    .select("id, client_downloaded_at")
    .eq("pack_id", pack.id);

  const list = allFiles ?? [];
  const allDone =
    list.length > 0 && list.every((f) => f.client_downloaded_at != null);

  if (allDone && pack.status !== "downloaded") {
    await admin
      .from("content_packs")
      .update({ status: "downloaded" })
      .eq("id", pack.id);
  }

  return NextResponse.json({ success: true, pack_complete: allDone });
}
