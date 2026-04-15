import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "Astra Studio",
  description: "Espace client & administration — Astra Studio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${sora.variable} font-sora bg-astra-bg text-astra-text antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
