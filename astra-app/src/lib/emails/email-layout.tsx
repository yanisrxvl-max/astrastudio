import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { emailLogoUrl, emailTheme } from "./theme";

type EmailLayoutProps = {
  preview?: string;
  children: React.ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="fr">
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body
        style={{
          margin: 0,
          padding: "40px 16px",
          backgroundColor: emailTheme.bodyBg,
          fontFamily:
            '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
        }}
      >
        <Container
          style={{
            maxWidth: emailTheme.maxWidth,
            margin: "0 auto",
          }}
        >
          <Section style={{ textAlign: "center", paddingBottom: 32 }}>
            <Img
              src={emailLogoUrl()}
              alt="Astra Studio"
              width={120}
              style={{ display: "inline-block", margin: "0 auto" }}
            />
          </Section>

          <Section
            style={{
              backgroundColor: emailTheme.cardBg,
              border: emailTheme.border,
              borderRadius: emailTheme.radius,
              padding: 32,
            }}
          >
            {children}
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

function EmailFooter() {
  return (
    <Section style={{ paddingTop: 24, textAlign: "center" }}>
      <Text
        style={{
          margin: "0 0 8px",
          fontSize: 11,
          lineHeight: 1.5,
          color: emailTheme.muted,
        }}
      >
        Astra Studio — Direction créative pour marques beauté
      </Text>
      <Text
        style={{
          margin: 0,
          fontSize: 11,
          lineHeight: 1.5,
          color: emailTheme.muted,
        }}
      >
        <Link
          href="https://studioastraparis.fr"
          style={{ color: emailTheme.muted, textDecoration: "underline" }}
        >
          studioastraparis.fr
        </Link>
      </Text>
      <Text style={{ margin: "12px 0 0", fontSize: 10, color: emailTheme.muted }}>
        <Link
          href={`mailto:bonjour@studioastraparis.fr?subject=${encodeURIComponent("Désinscription")}`}
          style={{ color: emailTheme.muted, textDecoration: "underline" }}
        >
          Se désinscrire
        </Link>
      </Text>
    </Section>
  );
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 8px",
        fontSize: 20,
        fontWeight: 600,
        color: emailTheme.text,
        lineHeight: 1.3,
      }}
    >
      {children}
    </Text>
  );
}

export function EmailSubheading({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 24px",
        fontSize: 14,
        color: emailTheme.secondary,
        lineHeight: 1.5,
      }}
    >
      {children}
    </Text>
  );
}

export function EmailParagraph({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontSize: 15,
        color: "#cccccc",
        lineHeight: 1.6,
      }}
    >
      {children}
    </Text>
  );
}

export function EmailCta({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={{ textAlign: "center", marginTop: 24 }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: emailTheme.gold,
          color: "#000000",
          textDecoration: "none",
          padding: "14px 32px",
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

export function EmailSignature() {
  return (
    <Text
      style={{
        margin: "24px 0 0",
        fontSize: 14,
        color: emailTheme.secondary,
        lineHeight: 1.5,
      }}
    >
      — Yanis, Astra Studio
    </Text>
  );
}

export function EmailCredentialsBox({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  return (
    <Section
      style={{
        margin: "16px 0 24px",
        backgroundColor: emailTheme.bodyBg,
        border: emailTheme.border,
        borderRadius: 10,
        padding: 20,
      }}
    >
      <Text style={{ margin: "0 0 10px", fontSize: 13, color: emailTheme.secondary }}>
        Email :{" "}
        <span style={{ color: emailTheme.text }}>{email}</span>
      </Text>
      <Text style={{ margin: 0, fontSize: 13, color: emailTheme.secondary }}>
        Mot de passe temporaire :{" "}
        <code
          style={{
            backgroundColor: emailTheme.goldSoft,
            color: emailTheme.gold,
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {password}
        </code>
      </Text>
    </Section>
  );
}

export { SITE_URL } from "./theme";
