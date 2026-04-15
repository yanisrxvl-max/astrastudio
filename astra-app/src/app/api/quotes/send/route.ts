import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, quoteSentSubject, quoteSentHtml } from "@/lib/emails";
import { renderQuotePdfBuffer } from "@/lib/pdf/render-quote-pdf";
import { firstNameFromFullName } from "@/lib/utils";

const STORAGE_BUCKET = "quotes-pdf";

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

  const { quote_id } = await request.json();
  if (!quote_id) {
    return NextResponse.json({ error: "quote_id requis" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: quote, error } = await admin
    .from("quotes")
    .select("*")
    .eq("id", quote_id)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await renderQuotePdfBuffer(quote);
  } catch (e) {
    console.error("PDF render:", e);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }

  const storagePath = `${quote.id}/devis.pdf`;
  const { error: upErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (upErr) {
    console.error("Storage upload:", upErr);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du PDF" },
      { status: 500 }
    );
  }

  const pdfUrl = `/api/quotes/${quote.id}/pdf`;
  const safeFileName = `Devis-${quote.quote_number.replace(/[^\w.-]+/g, "_")}.pdf`;

  const templateData = {
    recipientFirstName: firstNameFromFullName(quote.recipient_name),
    quoteNumber: quote.quote_number,
    totalCents: quote.total,
    validUntil: quote.valid_until,
  };

  const sent = await sendEmail({
    to: quote.recipient_email,
    subject: quoteSentSubject(templateData),
    html: await quoteSentHtml(templateData),
    attachments: [{ filename: safeFileName, content: buffer }],
  });

  if (!sent) {
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }

  await admin
    .from("quotes")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      pdf_url: pdfUrl,
    })
    .eq("id", quote.id);

  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  for (const a of admins ?? []) {
    await admin.from("notifications").insert({
      user_id: a.id,
      type: "message",
      title: "Devis envoyé",
      body: `Le devis ${quote.quote_number} a été envoyé à ${quote.recipient_name}.`,
      link: `/admin/quotes/${quote.id}`,
    });
  }

  return NextResponse.json({ success: true });
}
