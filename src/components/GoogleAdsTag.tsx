"use client";
import { useSyncExternalStore } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { GADS_ID } from "@/lib/gads";
import { OAI_CONSENT_EVENT, oaiConsented, oaiNeedsConsent, oaiSkip } from "@/lib/oai-pixel";

/*
 * The Google Ads tag (gtag.js), for conversion tracking (lib/gads.ts).
 * Nothing until NEXT_PUBLIC_GADS_ID is set; not on the admin and seller pages;
 * on /en and /fr only after the cookie consent. Once loaded it stays.
 */
const subscribe = (cb: () => void) => {
  window.addEventListener(OAI_CONSENT_EVENT, cb);
  return () => window.removeEventListener(OAI_CONSENT_EVENT, cb);
};
const snapshot = () => (oaiConsented() ? "yes" : "no");

export default function GoogleAdsTag() {
  const pathname = usePathname() || "/";
  const consent = useSyncExternalStore(subscribe, snapshot, () => "server");
  if (!GADS_ID || consent === "server" || oaiSkip(pathname)) return null;
  if (consent === "no" && oaiNeedsConsent(pathname)) return null;
  const init = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
gtag('js', new Date());
gtag('config', ${JSON.stringify(GADS_ID)});`;
  return (
    <>
      <Script id="gads-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GADS_ID)}`} />
      <Script id="gads-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: init }} />
    </>
  );
}
