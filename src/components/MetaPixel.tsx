"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { OAI_CONSENT_EVENT, oaiConsented, oaiNeedsConsent, oaiSkip } from "@/lib/oai-pixel";
import { META_PIXEL_ID, metaLead, metaPageView } from "@/lib/meta-pixel";

/*
 * Meta pixel base code (lib/meta-pixel.ts has the events). Loads only where
 * the other pixels do: not in the admin/seller areas, and on /en and /fr only
 * after the cookie consent. Nothing at all without NEXT_PUBLIC_META_PIXEL_ID.
 */
const SNIPPET = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(META_PIXEL_ID)});
(window.__fbqPending || []).splice(0).forEach(function (a) { fbq.apply(null, a); });`;

export default function MetaPixel() {
  const pathname = usePathname() || "/";
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    const read = () => setConsent(oaiConsented());
    read();
    window.addEventListener(OAI_CONSENT_EVENT, read);
    return () => window.removeEventListener(OAI_CONSENT_EVENT, read);
  }, []);
  const skip = !META_PIXEL_ID || oaiSkip(pathname) || (oaiNeedsConsent(pathname) && !consent);

  // PageView on every route change (the App Router does not reload the page)
  useEffect(() => { if (!skip) metaPageView(); }, [pathname, skip]);

  // any WhatsApp link is a lead
  useEffect(() => {
    if (!META_PIXEL_ID) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      const href = a?.getAttribute("href") || "";
      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href) || href.startsWith("whatsapp:")) metaLead("whatsapp");
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (skip) return null;
  return <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: SNIPPET }} />;
}
