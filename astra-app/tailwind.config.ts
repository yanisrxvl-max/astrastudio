import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "astra-bg": "#0a0a0a",
        "astra-card": "#111111",
        "astra-card-hover": "#161616",
        "astra-border": "rgba(255, 255, 255, 0.08)",
        "astra-border-hover": "rgba(255, 255, 255, 0.15)",
        "astra-gold": "#d4af37",
        "astra-gold-soft": "rgba(212, 175, 55, 0.15)",
        "astra-text": "#ffffff",
        "astra-text-secondary": "#888888",
        "astra-text-muted": "#555555",
        "astra-success": "#22c55e",
        "astra-warning": "#f59e0b",
        "astra-danger": "#ef4444",
      },
      fontFamily: {
        sora: ["var(--font-sora)", "Sora", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
      },
    },
  },
  plugins: [],
};

export default config;
