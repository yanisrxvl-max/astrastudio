import * as React from "react";
import { render } from "@react-email/render";
import {
  EmailLayout,
  EmailParagraph,
  EmailSignature,
} from "../email-layout";

export interface LeadConfirmationData {
  firstName: string;
}

export function leadConfirmationSubject(): string {
  return "Merci pour votre message — Astra Studio";
}

export function LeadConfirmationEmail({ firstName }: LeadConfirmationData) {
  return (
    <EmailLayout preview={`Merci ${firstName}, nous revenons vers vous sous 24h.`}>
      <EmailParagraph>
        Bonjour {firstName}, merci pour votre intérêt. Nous revenons vers vous sous 24h.
      </EmailParagraph>
      <EmailSignature />
    </EmailLayout>
  );
}

export async function leadConfirmationHtml(
  data: LeadConfirmationData
): Promise<string> {
  return render(<LeadConfirmationEmail {...data} />);
}
