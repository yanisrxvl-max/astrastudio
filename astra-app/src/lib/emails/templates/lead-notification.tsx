import * as React from "react";
import { render } from "@react-email/render";
import { Link, Section, Text } from "@react-email/components";
import {
  EmailCta,
  EmailHeading,
  EmailLayout,
  EmailSubheading,
  SITE_URL,
} from "../email-layout";
import { emailTheme } from "../theme";

export interface LeadNotificationData {
  firstName: string;
  email: string;
  phone: string | null;
  message: string;
  budgetRange: string | null;
  source: string | null;
  offerInterest: string | null;
}

export function leadNotificationSubject(data: LeadNotificationData): string {
  const offer = formatOfferLabel(data.offerInterest) || "Contact";
  return `🔔 Nouveau prospect : ${data.firstName} — ${offer}`;
}

function formatOfferLabel(raw: string | null): string {
  if (!raw) return "";
  const o = raw.toLowerCase();
  if (o.includes("audit")) return "Audit";
  if (o.includes("direction")) return "Direction";
  if (o.includes("custom") || o.includes("sur-mesure")) return "Custom";
  return raw;
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

export function LeadNotificationEmail(data: LeadNotificationData) {
  const offer = formatOfferLabel(data.offerInterest);
  return (
    <EmailLayout preview={`Nouveau prospect : ${data.firstName}`}>
      <EmailHeading>Nouveau prospect</EmailHeading>
      <EmailSubheading>
        {data.firstName} vient de remplir le formulaire de contact.
      </EmailSubheading>
      <Section style={{ marginBottom: 24 }}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
        >
          <tbody>
            <Row label="Prénom" value={data.firstName} />
            <Row
              label="Email"
              value={
                <Link
                  href={`mailto:${data.email}`}
                  style={{ color: emailTheme.gold, textDecoration: "none" }}
                >
                  {data.email}
                </Link>
              }
            />
            {data.phone ? <Row label="Téléphone" value={data.phone} /> : null}
            {data.message ? <Row label="Message" value={data.message} /> : null}
            {data.budgetRange ? (
              <Row label="Budget" value={data.budgetRange} />
            ) : null}
            {data.source ? <Row label="Source" value={data.source} /> : null}
            {offer ? <Row label="Offre" value={offer} /> : null}
          </tbody>
        </table>
      </Section>
      <EmailCta href={`${SITE_URL}/admin/leads`}>Voir dans le dashboard →</EmailCta>
    </EmailLayout>
  );
}

export async function leadNotificationHtml(
  data: LeadNotificationData
): Promise<string> {
  return render(<LeadNotificationEmail {...data} />);
}
