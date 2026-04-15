export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.astrastudio.fr";

/** Logo affiché dans les emails (URL absolue). Prévoir un PNG ~120px de large en prod. */
export function emailLogoUrl(): string {
  return `${SITE_URL}/images/astra-logo.svg`;
}

export const emailTheme = {
  bodyBg: "#0a0a0a",
  cardBg: "#111111",
  border: "1px solid rgba(255,255,255,0.08)",
  radius: "12px",
  text: "#ffffff",
  secondary: "#888888",
  muted: "#555555",
  gold: "#d4af37",
  goldSoft: "rgba(212,175,55,0.10)",
  maxWidth: "600px",
} as const;
