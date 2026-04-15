import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendEmail,
  sendToAdmin,
  leadConfirmationSubject,
  leadConfirmationHtml,
  leadNotificationSubject,
  leadNotificationHtml,
} from "@/lib/emails";

const ALLOWED_ORIGINS = [
  "https://astrastudio.fr",
  "https://www.astrastudio.fr",
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https?:\/\/localhost(:\d+)?$/.test(origin);
}

/**
 * CORS pour le site vitrine (astrastudio.fr) → API Next (app.astrastudio.fr).
 * Preflight OPTIONS : Allow-Headers limité à Content-Type (fetch JSON).
 */
function corsHeaders(origin: string | null) {
  const allowed = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();

    if (body.company_website) {
      return NextResponse.json({ success: true }, { headers });
    }

    const first_name = body.first_name || body.name || "";
    const email = body.email || "";
    const message = body.message || "";
    const budget_range = body.budget_range || body.budget || null;
    const source = body.source || null;
    const discovery = body.discovery || null;
    const phone = body.phone || null;
    const offer_interest = body.offer_interest || body.offer_context || null;

    const errors: Record<string, string> = {};

    if (!first_name || typeof first_name !== "string" || !first_name.trim()) {
      errors.name = "Le prénom est requis.";
    } else if (first_name.trim().length < 2) {
      errors.name = "Le prénom doit contenir au moins 2 caractères.";
    }

    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.email = "Une adresse email valide est requise.";
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      errors.message = "Le message est requis.";
    } else if (message.trim().length < 10) {
      errors.message = "Le message doit contenir au moins 10 caractères.";
    }

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      return NextResponse.json(
        { success: false, error: firstError, field_errors: errors },
        { status: 400, headers }
      );
    }

    const supabase = createAdminClient();
    const trimmedName = first_name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const resolvedSource = discovery || source || null;

    const { data: insertedLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        first_name: trimmedName,
        email: trimmedEmail,
        message: message?.trim() || "",
        budget_range: budget_range || null,
        source: resolvedSource,
        phone: phone || null,
        offer_interest: offer_interest || null,
        status: "new",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Lead insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'enregistrement." },
        { status: 500, headers }
      );
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminProfile && insertedLead) {
      await supabase.from("notifications").insert({
        user_id: adminProfile.id,
        type: "new_lead",
        title: `Nouveau prospect : ${trimmedName}`,
        body: `${trimmedName} (${trimmedEmail}) a envoyé un message.`,
        link: `/admin/leads?lead=${insertedLead.id}`,
      });
    }

    const templateData = {
      firstName: trimmedName,
      email: trimmedEmail,
      phone,
      message: message?.trim() || "",
      budgetRange: budget_range,
      source: resolvedSource,
      offerInterest: offer_interest,
    };

    await Promise.allSettled([
      sendEmail({
        to: trimmedEmail,
        subject: leadConfirmationSubject(),
        html: await leadConfirmationHtml({ firstName: trimmedName }),
      }),
      sendToAdmin(
        leadNotificationSubject(templateData),
        await leadNotificationHtml(templateData)
      ),
    ]);

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue." },
      { status: 500, headers }
    );
  }
}
