"use client";
import { useSyncExternalStore } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { OAI_CONSENT_EVENT, oaiConsented, oaiNeedsConsent, oaiSkip } from "@/lib/oai-pixel";

/*
 * Microsoft Clarity (heatmaps and session recordings). Same rules as the
 * other pixels: not on the admin and seller pages; on /en and /fr only after
 * the cookie consent. Once loaded it stays. The project ID can be overridden
 * with NEXT_PUBLIC_CLARITY_ID.
 */
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "tf91ao44c2";

const subscribe = (cb: () => void) => {
  window.addEventListener(OAI_CONSENT_EVENT, cb);
  return () => window.removeEventListener(OAI_CONSENT_EVENT, cb);
};
const snapshot = () => (oaiConsented() ? "yes" : "no");

export default function ClarityTag() {
  const pathname = usePathname() || "/";
  const consent = useSyncExternalStore(subscribe, snapshot, () => "server");
  if (!CLARITY_ID || consent === "server" || oaiSkip(pathname)) return null;
  if (consent === "no" && oaiNeedsConsent(pathname)) return null;
  const init = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(CLARITY_ID)});`;
  return <Script id="clarity-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: init }} />;
}
