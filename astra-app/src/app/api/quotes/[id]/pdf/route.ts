import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderQuotePdfBuffer } from "@/lib/pdf/render-quote-pdf";

const STORAGE_BUCKET = "quotes-pdf";

async function userCanAccessQuote(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userEmail: string | undefined,
  quote: {
    recipient_email: string;
    client_id: string | null;
  }
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") return true;

  if (
    userEmail &&
    quote.recipient_email.toLowerCase() === userEmail.toLowerCase()
  ) {
    return true;
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (client && quote.client_id && client.id === quote.client_id) {
    return true;
  }

  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const asDownload = request.nextUrl.searchParams.get("download") === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const admin = createAdminClient();
  const { data: quote, error } = await admin
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !quote) {
    return new NextResponse("Devis introuvable", { status: 404 });
  }

  const allowed = await userCanAccessQuote(
    supabase,
    user.id,
    user.email ?? undefined,
    quote
  );

  if (!allowed) {
    return new NextResponse("Accès refusé", { status: 403 });
  }

  const path = `${id}/devis.pdf`;
  const { data: fileData, error: dlErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .download(path);

  let buffer: Buffer;

  if (!dlErr && fileData) {
    buffer = Buffer.from(await fileData.arrayBuffer());
  } else {
    try {
      buffer = await renderQuotePdfBuffer(quote);
    } catch (e) {
      console.error("PDF render:", e);
      return new NextResponse("Erreur génération PDF", { status: 500 });
    }
  }

  const safeName = `${quote.quote_number.replace(/[^\w.-]+/g, "_")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${asDownload ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
