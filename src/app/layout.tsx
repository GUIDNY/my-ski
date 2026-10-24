import type { Metadata, Viewport } from "next";
import { Montserrat, Inter, Heebo, Rubik } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import ChromeGate from "@/components/ChromeGate";
import CookieConsent from "@/components/CookieConsent";
import DeepLinkHandler from "@/components/DeepLinkHandler";
import AiConcierge from "@/components/AiConcierge";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { SITE_LD, ldJson } from "@/lib/site";

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

// Hebrew glyphs: Montserrat and Inter have none, so Hebrew text used to fall
// back to whatever the device had. Heebo for body text, Rubik for headings.
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "800"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skisharebook.com"),
  // pages set their own title, description, canonical and share preview
  // (src/lib/page-meta.ts); these are only the fallbacks
  title: "SkiShare: חופשת סקי בואל טורנס",
  description: "חופשות סקי בואל טורנס בעברית: דירות לחבר'ה ולזוגות, סקי פס, הסעה משדה התעופה וציוד. כל אחד מהחבורה משלם את החלק שלו.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  // no og:url here: a page that forgot its own would point at the home page
  openGraph: {
    type: "website",
    siteName: "SkiShare",
    title: "SkiShare: חופשת סקי בואל טורנס",
    description: "דירות לחבר'ה ולזוגות בואל טורנס, ומוסיפים סקי פס, הסעה וציוד.",
    locale: "he_IL",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "SkiShare · Val Thorens" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkiShare: חופשת סקי בואל טורנס",
    description: "דירות לחבר'ה ולזוגות בואל טורנס, ומוסיפים סקי פס, הסעה וציוד.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The English and French site (/en, /fr) sets lang/dir to its own before the
    // first paint (components/intl/IntlShell.tsx), hence suppressHydrationWarning.
    <html
      lang="he"
      dir="rtl"
      suppressHydrationWarning
      className={`${montserrat.variable} ${inter.variable} ${heebo.variable} ${rubik.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(SITE_LD) }} />
        <SiteHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <ChromeGate hide={["/admin", "/quote/print", "/en", "/fr"]}><Footer /></ChromeGate>
        <DeepLinkHandler />
        <AiConcierge />
        <WhatsAppFloat />
        <CookieConsent />
      </body>
    </html>
  );
}
