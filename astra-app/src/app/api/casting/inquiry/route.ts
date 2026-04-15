import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, sendToAdmin } from "@/lib/emails";

const ALLOWED_ORIGINS = [
  "https://astrastudio.fr",
  "https://www.astrastudio.fr",
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
}

function corsHeaders(origin: string | null) {
  const allowed = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

type InquiryType = "brand" | "talent";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();
    const inquiryType = body?.type as InquiryType | undefined;

    if (body?.company_website) {
      return NextResponse.json({ success: true }, { headers });
    }

    if (inquiryType !== "brand" && inquiryType !== "talent") {
      return NextResponse.json(
        { success: false, error: "Type de demande invalide." },
        { status: 400, headers }
      );
    }

    const first_name = String(body?.first_name ?? body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const phone = body?.phone ? String(body.phone).trim() : null;

    const errors: Record<string, string> = {};

    if (!first_name || first_name.length < 2) {
      errors.name = "Le prénom est requis (min. 2 caractères).";
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Une adresse email valide est requise.";
    }

    let messageBlock = "";
    let budget_range: string | null = null;

    if (inquiryType === "brand") {
      const company = String(body?.company ?? "").trim();
      const missionType = String(body?.mission_type ?? "").trim();
      const city = String(body?.city ?? "").trim();
      const dates = String(body?.dates ?? "").trim();
      const profiles = String(body?.profiles_count ?? "").trim();
      const brief = String(body?.brief ?? "").trim();
      budget_range = body?.budget ? String(body.budget).trim() : null;

      if (!brief || brief.length < 20) {
        errors.brief = "Décrivez votre besoin (min. 20 caractères).";
      }

      messageBlock = [
        `[CASTING — MARQUE / AGENCE]`,
        company ? `Société / marque : ${company}` : "",
        missionType ? `Type de mission : ${missionType}` : "",
        city ? `Ville : ${city}` : "",
        dates ? `Dates : ${dates}` : "",
        profiles ? `Nombre de profils : ${profiles}` : "",
        budget_range ? `Budget indicatif : ${budget_range}` : "",
        "",
        "Brief :",
        brief,
      ]
        .filter(Boolean)
        .join("\n");
    } else {
      const age = String(body?.age ?? "").trim();
      const city = String(body?.city ?? "").trim();
      const styles = String(body?.styles ?? "").trim();
      const experience = String(body?.experience ?? "").trim();
      const availability = String(body?.availability ?? "").trim();
      const mobility = String(body?.mobility ?? "").trim();
      const social = String(body?.social ?? "").trim();
      const motivation = String(body?.motivation ?? "").trim();

      const ageNum = parseInt(age, 10);
      if (!age || Number.isNaN(ageNum) || ageNum < 18) {
        errors.age = "Vous devez être majeur·e (18+) pour vous inscrire.";
      }

      if (!motivation || motivation.length < 20) {
        errors.motivation = "Présentez-vous en quelques lignes (min. 20 caractères).";
      }

      messageBlock = [
        `[CASTING — TALENT]`,
        `Âge déclaré : ${age} (profil majeur requis)`,
        city ? `Ville : ${city}` : "",
        styles ? `Styles / univers : ${styles}` : "",
        experience ? `Expérience : ${experience}` : "",
        availability ? `Disponibilités : ${availability}` : "",
        mobility ? `Mobilité : ${mobility}` : "",
        social ? `Réseaux / book : ${social}` : "",
        "",
        "Motivation :",
        motivation,
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: Object.values(errors)[0], field_errors: errors },
        { status: 400, headers }
      );
    }

    const supabase = createAdminClient();

    const { data: inserted, error: insertError } = await supabase
      .from("leads")
      .insert({
        first_name,
        email,
        message: messageBlock,
        budget_range,
        source: "Astra Casting — Site vitrine",
        phone,
        offer_interest:
          inquiryType === "brand" ? "casting-marque" : "casting-talent",
        status: "new",
      })
      .select()
      .single();

    if (insertError || !inserted) {
      console.error("Casting inquiry insert:", insertError);
      return NextResponse.json(
        { success: false, error: "Enregistrement impossible." },
        { status: 500, headers }
      );
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (adminProfile) {
      await supabase.from("notifications").insert({
        user_id: adminProfile.id,
        type: "new_lead",
        title:
          inquiryType === "brand"
            ? `Casting — Brief marque : ${first_name}`
            : `Casting — Talent : ${first_name}`,
        body: `${email} — ${inquiryType === "brand" ? "Demande brief" : "Inscription talent"}`,
        link: `/admin/leads?lead=${inserted.id}`,
      });
    }

    const label = inquiryType === "brand" ? "Marque / agence" : "Talent";
    const adminHtml = `
      <p><strong>Nouvelle demande Astra Casting (${label})</strong></p>
      <p>Prénom : ${escapeHtml(first_name)}<br/>Email : ${escapeHtml(email)}</p>
      <pre style="font-family:sans-serif;white-space:pre-wrap;">${escapeHtml(messageBlock)}</pre>
    `;

    await Promise.allSettled([
      sendEmail({
        to: email,
        subject:
          inquiryType === "brand"
            ? "Votre demande de casting — Astra Studio"
            : "Inscription bien reçue — Astra Casting",
        html: `<p>Bonjour ${escapeHtml(first_name)},</p>
          <p>Nous avons bien reçu votre demande. L'équipe revient vers vous sous 24h ouvrées.</p>
          <p>— Astra Studio</p>`,
      }),
      sendToAdmin(`Casting ${label} : ${first_name}`, adminHtml),
    ]);

    return NextResponse.json({ success: true }, { headers });
  } catch (e) {
    console.error("Casting inquiry:", e);
    const origin = request.headers.get("origin");
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue." },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
