import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import MobileTabBar from "@/components/MobileTabBar";
import CookieConsent from "@/components/CookieConsent";
import DeepLinkHandler from "@/components/DeepLinkHandler";
import AiConcierge from "@/components/AiConcierge";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

// No maximumScale before this: on the iOS App Store app (Capacitor WKWebView,
// see capacitor.config.ts), focusing any control with a sub-16px computed
// font triggers WebKit's automatic zoom-to-focused-element, and inside a
// native WebView (no Safari chrome/pinch-reset) that reads as the whole
// screen suddenly blowing up huge with no way back — this is what was
// reported for the AI concierge launcher/chat inputs.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Real registered business details (same ones shown in the site footer/legal
// pages) — lets Google associate the site with an actual business entity
// instead of just a set of pages, which matters for how it's surfaced for
// brand and local-intent searches ("דירות בואל טורנס" etc).
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "SkiShare",
  legalName: "סקי שר בע\"מ",
  url: "https://skisharebook.com",
  logo: "https://skisharebook.com/skishare-logo.png",
  image: "https://skisharebook.com/og.jpg",
  telephone: "+972547701899",
  email: "skishareteam@gmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "הזוהר 12",
    addressLocality: "קיסריה",
    addressCountry: "IL",
  },
  areaServed: { "@type": "Place", name: "Val Thorens, France" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
        {children}
        <DeepLinkHandler />
        <MobileTabBar />
        <AiConcierge />
        <CookieConsent />
      </body>
    </html>
  );
}
