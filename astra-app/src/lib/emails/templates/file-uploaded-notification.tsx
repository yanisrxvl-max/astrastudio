import * as React from "react";
import { render } from "@react-email/render";
import { Section } from "@react-email/components";
import {
  EmailCta,
  EmailHeading,
  EmailLayout,
  EmailSubheading,
  SITE_URL,
} from "../email-layout";
import { emailTheme } from "../theme";
import { formatFileSize } from "@/lib/utils";

export interface FileUploadedNotificationData {
  clientName: string;
  clientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  notes: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  brief: "Brief",
  asset: "Asset",
  photo: "Photo",
  document: "Document",
  other: "Autre",
};

export function fileUploadedNotificationSubject(
  data: FileUploadedNotificationData
): string {
  return `📎 Nouveau fichier de ${data.clientName} — ${data.fileName}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td
        style={{
          padding: "6px 0",
          fontSize: 13,
          color: emailTheme.secondary,
          width: 140,
          verticalAlign: "top",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "6px 0",
          fontSize: 13,
          color: emailTheme.text,
          verticalAlign: "top",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export function FileUploadedNotificationEmail(data: FileUploadedNotificationData) {
  const typeLabel = TYPE_LABELS[data.fileType] || data.fileType;
  return (
    <EmailLayout preview={`Fichier : ${data.fileName}`}>
      <EmailHeading>Nouveau fichier reçu</EmailHeading>
      <EmailSubheading>
        {data.clientName} vient d&apos;envoyer un fichier.
      </EmailSubheading>
      <Section style={{ marginBottom: 24 }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
        >
          <tbody>
            <Row label="Client" value={data.clientName} />
            <Row label="Fichier" value={data.fileName} />
            <Row label="Type" value={typeLabel} />
            <Row label="Taille" value={formatFileSize(data.fileSize)} />
            {data.notes ? <Row label="Notes" value={data.notes} /> : null}
          </tbody>
        </table>
      </Section>
      <EmailCta href={`${SITE_URL}/admin/clients/${data.clientId}?tab=fichiers`}>
        Voir la fiche client →
      </EmailCta>
    </EmailLayout>
  );
}

export async function fileUploadedNotificationHtml(
  data: FileUploadedNotificationData
): Promise<string> {
  return render(<FileUploadedNotificationEmail {...data} />);
}
