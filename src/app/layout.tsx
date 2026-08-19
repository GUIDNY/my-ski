import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import "./globals.css";
import MobileTabBar from "@/components/MobileTabBar";
import CookieConsent from "@/components/CookieConsent";
import DeepLinkHandler from "@/components/DeepLinkHandler";

// Display serif — elegant, editorial, renders both Hebrew & Latin (headlines).
const frankRuhlLibre = Frank_Ruhl_Libre({
  variable: "--font-display",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
});

// Refined humanist sans — body copy & UI, renders both Hebrew & Latin.
const heebo = Heebo({
  variable: "--font-sans",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skisharebook.com"),
  title: "SkiShare — Val Thorens",
  description: "חופשות וסקי בוואל טורנס — דירות, סקי פס, הסעות, ואזור הסיזיונרים. SkiShare.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "SkiShare",
    url: "https://skisharebook.com",
    title: "SkiShare — חופשות סקי בוואל טורנס",
    description: "דירות, סקי פס, הסעות ואזור הסיזיונרים — חופשת הסקי המושלמת ב-Val Thorens.",
    locale: "he_IL",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "SkiShare · Val Thorens" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkiShare — חופשות סקי בוואל טורנס",
    description: "דירות, סקי פס, הסעות ואזור הסיזיונרים ב-Val Thorens.",
    images: ["/og.jpg"],
  },
  // iOS Smart App Banner — Safari shows "Open in app" if installed, else App Store
  itunes: { appId: "6782095727" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      className={`${frankRuhlLibre.variable} ${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "var(--ivory)" }}>
        {children}
        <DeepLinkHandler />
        <MobileTabBar />
        <CookieConsent />
      </body>
    </html>
  );
}
