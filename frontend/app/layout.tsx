import { Merriweather, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import "./globals.css";

// Body font — Merriweather (serif used as the default body typeface)
const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

// Heading font — Source Serif 4 for page titles, section headers
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Monospace font — JetBrains Mono for code blocks, quiz answers
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BahasaBot — Learn Bahasa Melayu",
  description: "AI-powered Bahasa Melayu language learning platform",
  icons: {
    icon: [{ url: "/Logo new only box (1).svg", type: "image/svg+xml" }],
    apple: [{ url: "/Logo new only box (1).svg" }],
    shortcut: "/Logo new only box (1).svg",
  },
};

// Root layout — wraps all pages with SessionProvider + QueryClientProvider
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        merriweather.variable,
        sourceSerif4.variable,
        jetbrainsMono.variable,
      )}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script — runs before hydration to apply saved/system theme with no flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
