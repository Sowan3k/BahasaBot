import { Inter, Lora } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({ subsets: ["latin"], variable: "--font-heading", weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "BahasaBot — Learn Bahasa Melayu",
  description: "AI-powered Bahasa Melayu language learning platform",
  icons: {
    icon: [
      { url: "/Project Logo.png", sizes: "16x16", type: "image/png" },
      { url: "/Project Logo.png", sizes: "32x32", type: "image/png" },
      { url: "/Project Logo.png", sizes: "48x48", type: "image/png" },
      { url: "/Project Logo.png", sizes: "96x96", type: "image/png" },
      { url: "/Project Logo.png", sizes: "192x192", type: "image/png" },
      { url: "/Project Logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/Project Logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/Project Logo.png",
  },
};

// Root layout — wraps all pages with SessionProvider + QueryClientProvider
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, lora.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
