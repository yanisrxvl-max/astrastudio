import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendEmail,
  clientWelcomeSubject,
  clientWelcomeHtml,
} from "@/lib/emails";
import crypto from "crypto";

function generatePassword(length = 12): string {
  const chars =
    "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Non authentifié." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Accès refusé." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { client_id } = body;

    if (!client_id) {
      return NextResponse.json(
        { success: false, error: "client_id requis." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: client, error: clientError } = await admin
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: "Client introuvable." },
        { status: 404 }
      );
    }

    if (client.user_id) {
      return NextResponse.json(
        { success: false, error: "Ce client a déjà un compte." },
        { status: 400 }
      );
    }

    const tempPassword = generatePassword();

    const { data: newUser, error: createError } =
      await admin.auth.admin.createUser({
        email: client.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          must_change_password: true,
          full_name: client.contact_name,
        },
      });

    if (createError || !newUser.user) {
      console.error("Create user error:", createError);
      return NextResponse.json(
        {
          success: false,
          error:
            createError?.message ??
            "Erreur lors de la création du compte.",
        },
        { status: 500 }
      );
    }

    const userId = newUser.user.id;

    await admin.from("profiles").upsert({
      id: userId,
      role: "client",
      full_name: client.contact_name,
      company_name: client.company_name,
    });

    await admin
      .from("clients")
      .update({ user_id: userId })
      .eq("id", client_id);

    await sendEmail({
      to: client.email,
      subject: clientWelcomeSubject(),
      html: await clientWelcomeHtml({
        clientName: client.contact_name,
        email: client.email,
        tempPassword,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create client account error:", error);
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
