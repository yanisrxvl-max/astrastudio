import * as React from "react";
import { render } from "@react-email/render";
import { Text } from "@react-email/components";
import {
  EmailCta,
  EmailCredentialsBox,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
  EmailSignature,
  SITE_URL,
} from "../email-layout";
import { emailTheme } from "../theme";

export interface ClientWelcomeData {
  clientName: string;
  email: string;
  tempPassword: string;
}

export function clientWelcomeSubject(): string {
  return "Bienvenue dans votre espace Astra Studio";
}

export function ClientWelcomeEmail(data: ClientWelcomeData) {
  return (
    <EmailLayout preview="Vos identifiants de connexion Astra Studio">
      <EmailHeading>Bienvenue chez Astra Studio</EmailHeading>
      <EmailParagraph>Bonjour {data.clientName},</EmailParagraph>
      <EmailParagraph>
        Votre espace client est maintenant accessible. Vous y retrouverez vos
        contenus, devis et fichiers partagés.
      </EmailParagraph>
      <EmailParagraph>
        Connectez-vous avec l&apos;email et le mot de passe temporaire ci-dessous
        :
      </EmailParagraph>
      <EmailCredentialsBox email={data.email} password={data.tempPassword} />
      <EmailCta href={`${SITE_URL}/login`}>Se connecter →</EmailCta>
      <Text
        style={{
          margin: "16px 0 0",
          fontSize: 13,
          color: emailTheme.secondary,
          lineHeight: 1.5,
        }}
      >
        À la première connexion, vous serez invité à définir un nouveau mot de
        passe personnel avant d&apos;accéder à votre espace.
      </Text>
      <EmailSignature />
    </EmailLayout>
  );
}

export async function clientWelcomeHtml(
  data: ClientWelcomeData
): Promise<string> {
  return render(<ClientWelcomeEmail {...data} />);
}
