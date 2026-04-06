import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Merriweather — default body font everywhere
        sans: ["var(--font-sans)", "serif"],
        // Source Serif 4 — headings and page titles
        serif: ["var(--font-serif)", "serif"],
        // JetBrains Mono — code blocks, quiz answers, monospaced text
        mono: ["var(--font-mono)", "monospace"],
        // heading alias keeps existing `font-heading` utilities pointing to Source Serif 4
        heading: ["var(--font-serif)", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: {
            DEFAULT: "var(--sidebar-primary)",
            foreground: "var(--sidebar-primary-foreground)",
          },
          accent: {
            DEFAULT: "var(--sidebar-accent)",
            foreground: "var(--sidebar-accent-foreground)",
          },
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
      },
      // Wire prose colours into the CSS variable tokens for light/dark mode
      typography: {
        DEFAULT: {
          css: {
            a: { color: "var(--primary)" },
            h1: { color: "var(--foreground)" },
            h2: { color: "var(--foreground)" },
            h3: { color: "var(--foreground)" },
            h4: { color: "var(--foreground)" },
            strong: { color: "var(--foreground)" },
            // Remove backtick wrapping added by default typography styles
            "code::before": { content: '""' },
            "code::after": { content: '""' },
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
