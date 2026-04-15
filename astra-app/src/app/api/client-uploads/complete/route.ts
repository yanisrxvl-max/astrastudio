import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendToAdmin,
  fileUploadedNotificationSubject,
  fileUploadedNotificationHtml,
} from "@/lib/emails";
import {
  classifyClientUploadType,
  CLIENT_UPLOAD_MAX_BYTES,
} from "@/lib/client-upload/rules";

/**
 * Après upload Storage (URL signée), enregistre la ligne + notifie les admins (+ email optionnel).
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
  const path = body?.path as string | undefined;
  const file_name = body?.file_name as string | undefined;
  const file_size = Number(body?.file_size);
  const mime_type = (body?.mime_type as string) || "application/octet-stream";
  const notes = (body?.notes as string | null) ?? null;
  const notify_email = Boolean(body?.notify_email);

  if (!path || !file_name || !Number.isFinite(file_size)) {
    return NextResponse.json(
      { error: "path, file_name et file_size requis" },
      { status: 400 }
    );
  }

  if (file_size > CLIENT_UPLOAD_MAX_BYTES || file_size < 0) {
    return NextResponse.json({ error: "Taille de fichier invalide" }, { status: 400 });
  }

  const { data: clientRow } = await supabase
    .from("clients")
    .select("id, company_name")
    .eq("user_id", user.id)
    .single();

  if (!clientRow) {
    return NextResponse.json({ error: "Aucun compte client lié" }, { status: 403 });
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 2 || segments[0] !== clientRow.id) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  const file_type = classifyClientUploadType(mime_type, file_name);

  const { data: row, error: insErr } = await supabase
    .from("client_uploads")
    .insert({
      client_id: clientRow.id,
      uploaded_by: user.id,
      file_name,
      file_type,
      file_size,
      file_url: path,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (insErr || !row) {
    console.error("client_uploads insert:", insErr);
    return NextResponse.json(
      { error: "Enregistrement impossible" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  const companyName = clientRow.company_name ?? "Client";
  const notifBody = `Nouveau fichier reçu de ${companyName}`;

  for (const a of admins ?? []) {
    const { error: nErr } = await admin.from("notifications").insert({
      user_id: a.id,
      type: "file_uploaded",
      title: "Nouveau fichier client",
      body: notifBody,
      link: `/admin/clients/${clientRow.id}?tab=fichiers`,
    });
    if (nErr) console.error("notification insert:", nErr);
  }

  if (notify_email) {
    await sendToAdmin(
      fileUploadedNotificationSubject({
        clientName: companyName,
        clientId: clientRow.id,
        fileName: file_name,
        fileType: file_type,
        fileSize: file_size,
        notes: notes?.trim() || null,
      }),
      await fileUploadedNotificationHtml({
        clientName: companyName,
        clientId: clientRow.id,
        fileName: file_name,
        fileType: file_type,
        fileSize: file_size,
        notes: notes?.trim() || null,
      })
    );
  }

  return NextResponse.json({ upload: row });
}
