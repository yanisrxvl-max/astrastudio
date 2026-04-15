import * as React from "react";
import { render } from "@react-email/render";
import { Text } from "@react-email/components";
import {
  EmailCta,
  EmailLayout,
  EmailParagraph,
  SITE_URL,
} from "../email-layout";
import { formatEurosFromCents, formatDateShortFr } from "@/lib/utils";
import { emailTheme } from "../theme";

export interface QuoteSentData {
  recipientFirstName: string;
  quoteNumber: string;
  totalCents: number;
  validUntil: string;
}

export function quoteSentSubject(data: QuoteSentData): string {
  return `Devis ${data.quoteNumber} — Astra Studio`;
}

export function QuoteSentEmail(data: QuoteSentData) {
  const total = formatEurosFromCents(data.totalCents);
  const valid = formatDateShortFr(data.validUntil);

  return (
    <EmailLayout
      preview={`Devis ${data.quoteNumber} — ${total}`}
    >
      <EmailParagraph>Bonjour {data.recipientFirstName},</EmailParagraph>
      <EmailParagraph>
        Vous trouverez en pièce jointe le devis n° {data.quoteNumber} pour les
        prestations discutées.
      </EmailParagraph>
      <Text
        style={{
          margin: "0 0 16px",
          fontSize: 15,
          lineHeight: 1.6,
          color: "#cccccc",
        }}
      >
        <span style={{ color: emailTheme.text, fontWeight: 600 }}>
          Montant total : {total}
        </span>
        <br />
        <span style={{ color: emailTheme.secondary, fontSize: 14 }}>
          Valide jusqu&apos;au : {valid}
        </span>
      </Text>
      <EmailParagraph>
        Pour accepter ce devis, vous pouvez répondre à cet email ou consulter
        votre espace client.
      </EmailParagraph>
      <EmailCta href={`${SITE_URL}/client/quotes`}>
        Accéder à mon espace (devis) →
      </EmailCta>
      <EmailParagraph>
        À très vite,
        <br />
        <span style={{ color: emailTheme.gold }}>Yanis</span> — Astra Studio
      </EmailParagraph>
    </EmailLayout>
  );
}

export async function quoteSentHtml(data: QuoteSentData): Promise<string> {
  return render(<QuoteSentEmail {...data} />);
}
