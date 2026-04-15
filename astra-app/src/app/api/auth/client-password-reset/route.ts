import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendEmail,
  passwordResetLinkSubject,
  passwordResetLinkHtml,
} from "@/lib/emails";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.studioastraparis.fr";

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

  const { client_id } = await request.json();
  if (!client_id) {
    return NextResponse.json({ error: "client_id requis" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: client, error } = await admin
    .from("clients")
    .select("email, user_id")
    .eq("id", client_id)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  if (!client.user_id) {
    return NextResponse.json(
      { error: "Aucun compte lié à ce client." },
      { status: 400 }
    );
  }

  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: "recovery",
      email: client.email,
      options: {
        redirectTo: `${SITE}/update-password`,
      },
    });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("generateLink:", linkErr);
    return NextResponse.json(
      { error: "Impossible de générer le lien de réinitialisation." },
      { status: 500 }
    );
  }

  const sent = await sendEmail({
    to: client.email,
    subject: passwordResetLinkSubject(),
    html: await passwordResetLinkHtml(linkData.properties.action_link),
  });

  if (!sent) {
    return NextResponse.json(
      { error: "Erreur d'envoi de l'email." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
