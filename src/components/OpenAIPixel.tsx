"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { OAI_CONSENT_EVENT, OAI_PIXEL_ID, oaiConsented, oaiLead, oaiNeedsConsent, oaiPageView, oaiSkip } from "@/lib/oai-pixel";

/*
 * OpenAI Ads measurement pixel (see lib/oai-pixel.ts for the events).
 * The snippet is OpenAI's own, as given in Ads Manager > Conversions.
 * Not on the admin and seller pages; on /en and /fr only after the cookie consent.
 */
const SNIPPET = `(function (w, d, s, u) {
  if (w.oaiq) return;
  var q = function () { q.q.push(arguments); };
  q.q = [];
  w.oaiq = q;
  var js = d.createElement(s);
  js.async = true;
  js.src = u;
  var f = d.getElementsByTagName(s)[0];
  f.parentNode.insertBefore(js, f);
})(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");
oaiq("init", { pixelId: ${JSON.stringify(OAI_PIXEL_ID)} });
(window.__oaiPending || []).splice(0).forEach(function (a) { oaiq.apply(null, a); });`;

export default function OpenAIPixel() {
  const pathname = usePathname() || "/";
  // consent is read after mount (localStorage), and again when the banner is accepted
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    const read = () => setConsent(oaiConsented());
    read();
    window.addEventListener(OAI_CONSENT_EVENT, read);
    return () => window.removeEventListener(OAI_CONSENT_EVENT, read);
  }, []);
  const skip = oaiSkip(pathname) || (oaiNeedsConsent(pathname) && !consent);

  // a page view on every page change (the App Router does not reload the page)
  useEffect(() => {
    if (!skip) oaiPageView();
  }, [pathname, skip]);

  // any WhatsApp link on the site is a lead (the floating button, the quote
  // pages, the pay pages...): one listener instead of touching every link
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href) || href.startsWith("whatsapp:")) oaiLead("whatsapp");
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (skip || !OAI_PIXEL_ID) return null;
  return <Script id="oai-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: SNIPPET }} />;
}
