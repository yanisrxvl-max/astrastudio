import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendEmail,
  contentDeliveredSubject,
  contentDeliveredHtml,
} from "@/lib/emails";
import { firstNameFromFullName } from "@/lib/utils";

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

  const body = await request.json();
  const pack_id = body?.pack_id as string | undefined;
  const resendOnly = Boolean(body?.resend_only);

  if (!pack_id) {
    return NextResponse.json({ error: "pack_id requis" }, { status: 400 });
  }

  const { data: pack, error: packError } = await supabase
    .from("content_packs")
    .select("*")
    .eq("id", pack_id)
    .single();

  if (packError || !pack) {
    return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });
  }

  const { data: files } = await supabase
    .from("content_files")
    .select("file_size")
    .eq("pack_id", pack_id);

  const fileCount = files?.length ?? 0;
  const totalSize = files?.reduce((sum, f) => sum + f.file_size, 0) ?? 0;

  if (resendOnly) {
    if (pack.status !== "delivered") {
      return NextResponse.json(
        { error: "Le pack doit être livré avant de renvoyer l’email." },
        { status: 400 }
      );
    }
  }

  if (!resendOnly) {
    if (fileCount === 0) {
      return NextResponse.json(
        { error: "Ajoutez au moins un fichier avant la livraison." },
        { status: 400 }
      );
    }

    const deliveredAt = new Date().toISOString();

    const { error: updErr } = await supabase
      .from("content_packs")
      .update({
        status: "delivered",
        delivered_at: deliveredAt,
        opened_at: null,
      })
      .eq("id", pack_id);

    if (updErr) {
      console.error("deliver update pack:", updErr);
      return NextResponse.json(
        { error: "Mise à jour impossible" },
        { status: 500 }
      );
    }
  }

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", pack.client_id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  await sendEmail({
    to: client.email,
    subject: contentDeliveredSubject(),
    html: await contentDeliveredHtml({
      recipientFirstName: firstNameFromFullName(client.contact_name),
      packTitle: pack.title,
      fileCount,
      totalSize,
    }),
  });

  if (client.user_id) {
    await supabase.from("notifications").insert({
      user_id: client.user_id,
      type: "content_delivered",
      title: "Nouveau contenu disponible",
      body: `Votre pack « ${pack.title} » est prêt.`,
      link: `/client/content/${pack.id}`,
    });
  }

  return NextResponse.json({ success: true });
}
