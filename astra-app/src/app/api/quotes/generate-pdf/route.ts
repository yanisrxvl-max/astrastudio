import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderQuotePdfBuffer } from "@/lib/pdf/render-quote-pdf";

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
    console.error("PDF render error:", e);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }

  const path = `${quote.id}/devis.pdf`;

  const { error: upErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
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

  await admin.from("quotes").update({ pdf_url: pdfUrl }).eq("id", quote.id);

  return NextResponse.json({ success: true, url: pdfUrl });
}
