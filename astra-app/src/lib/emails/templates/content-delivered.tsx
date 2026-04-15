import * as React from "react";
import { render } from "@react-email/render";
import { Text } from "@react-email/components";
import {
  EmailCta,
  EmailLayout,
  EmailParagraph,
  SITE_URL,
} from "../email-layout";
import { formatFileSize } from "@/lib/utils";
import { emailTheme } from "../theme";

export interface ContentDeliveredData {
  recipientFirstName: string;
  packTitle: string;
  fileCount: number;
  totalSize: number;
}

export function contentDeliveredSubject(): string {
  return "Votre pack contenu est prêt ✨ — Astra Studio";
}

export function ContentDeliveredEmail(data: ContentDeliveredData) {
  const summary = `${data.fileCount} fichier${data.fileCount > 1 ? "s" : ""} • ${formatFileSize(data.totalSize)}`;

  return (
    <EmailLayout preview={`${data.packTitle} — ${summary}`}>
      <EmailParagraph>Bonjour {data.recipientFirstName},</EmailParagraph>
      <EmailParagraph>
        Votre pack{" "}
        <span style={{ color: emailTheme.text, fontWeight: 600 }}>
          {data.packTitle}
        </span>{" "}
        est maintenant disponible dans votre espace.
      </EmailParagraph>
      <Text
        style={{
          margin: "0 0 16px",
          fontSize: 15,
          lineHeight: 1.6,
          color: emailTheme.gold,
          fontWeight: 600,
        }}
      >
        {summary}
      </Text>
      <EmailCta href={`${SITE_URL}/client/content`}>Accéder à mon espace →</EmailCta>
      <EmailParagraph>
        À très vite,
        <br />
        <span style={{ color: emailTheme.gold }}>Yanis</span> — Astra Studio
      </EmailParagraph>
    </EmailLayout>
  );
}

export async function contentDeliveredHtml(
  data: ContentDeliveredData
): Promise<string> {
  return render(<ContentDeliveredEmail {...data} />);
}
