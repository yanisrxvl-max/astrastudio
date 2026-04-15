import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendToAdmin,
  fileUploadedNotificationSubject,
  fileUploadedNotificationHtml,
} from "@/lib/emails";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { clientId, clientName, fileName, fileType, fileSize, notes } = body;

  if (!clientId || !fileName) {
    return NextResponse.json(
      { error: "clientId et fileName requis" },
      { status: 400 }
    );
  }

  const templateData = {
    clientName: clientName || "Client",
    clientId,
    fileName,
    fileType: fileType || "other",
    fileSize: fileSize || 0,
    notes: notes || null,
  };

  await sendToAdmin(
    fileUploadedNotificationSubject(templateData),
    await fileUploadedNotificationHtml(templateData)
  );

  return NextResponse.json({ success: true });
}
