import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyMime } from "@/lib/content/file-rules";

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
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const packId = body?.pack_id as string | undefined;
  const path = body?.path as string | undefined;
  const fileName = body?.file_name as string | undefined;
  const fileSize = Number(body?.file_size);
  const mimeType = (body?.mime_type as string) || "application/octet-stream";

  if (!packId || !path || !fileName || !Number.isFinite(fileSize)) {
    return NextResponse.json(
      { error: "pack_id, path, file_name, file_size requis" },
      { status: 400 }
    );
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 3) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  const [clientIdFromPath, packIdFromPath] = segments;
  if (packIdFromPath !== packId) {
    return NextResponse.json(
      { error: "Le chemin ne correspond pas au pack" },
      { status: 400 }
    );
  }

  const { data: pack, error: packErr } = await supabase
    .from("content_packs")
    .select("id, client_id, status")
    .eq("id", packId)
    .single();

  if (packErr || !pack) {
    return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });
  }

  if (pack.client_id !== clientIdFromPath) {
    return NextResponse.json({ error: "Client invalide" }, { status: 400 });
  }

  if (pack.status !== "preparing") {
    return NextResponse.json(
      { error: "Le pack n'est plus modifiable" },
      { status: 400 }
    );
  }

  const { data: maxRow } = await supabase
    .from("content_files")
    .select("sort_order")
    .eq("pack_id", packId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (maxRow?.sort_order ?? -1) + 1;

  const file_type = classifyMime(mimeType);

  const { data: row, error: insErr } = await supabase
    .from("content_files")
    .insert({
      pack_id: packId,
      file_name: fileName,
      file_type,
      file_size: fileSize,
      file_url: path,
      mime_type: mimeType,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (insErr || !row) {
    console.error("register-file insert:", insErr);
    return NextResponse.json(
      { error: "Enregistrement du fichier impossible" },
      { status: 500 }
    );
  }

  return NextResponse.json({ file: row });
}
