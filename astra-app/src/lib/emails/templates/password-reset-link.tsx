import * as React from "react";
import { render } from "@react-email/render";
import { Link } from "@react-email/components";
import {
  EmailLayout,
  EmailParagraph,
} from "../email-layout";
import { emailTheme } from "../theme";

export function passwordResetLinkSubject(): string {
  return "Réinitialisation de votre mot de passe — Astra Studio";
}

export function PasswordResetLinkEmail({ link }: { link: string }) {
  return (
    <EmailLayout preview="Réinitialisez votre mot de passe Astra Studio">
      <EmailParagraph>Bonjour,</EmailParagraph>
      <EmailParagraph>
        Pour choisir un nouveau mot de passe pour votre espace client, cliquez
        sur le lien ci-dessous (lien valide peu de temps) :
      </EmailParagraph>
      <EmailParagraph>
        <Link
          href={link}
          style={{ color: emailTheme.gold, fontWeight: 600 }}
        >
          Réinitialiser mon mot de passe →
        </Link>
      </EmailParagraph>
      <EmailParagraph>
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet
        email.
      </EmailParagraph>
    </EmailLayout>
  );
}

export async function passwordResetLinkHtml(link: string): Promise<string> {
  return render(<PasswordResetLinkEmail link={link} />);
}
