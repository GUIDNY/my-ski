"use client";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { OAI_CONSENT_EVENT, oaiConsented, oaiNeedsConsent } from "@/lib/oai-pixel";

/*
 * Vercel Web Analytics. Same rule as the OpenAI pixel: on the English/French
 * site (/en, /fr) nothing is loaded or sent before the visitor agreed to cookies.
 * (A client component because the layout can't pass beforeSend, a function.)
 */
const path = (url: string) => { try { return new URL(url).pathname; } catch { return "/"; } };

const subscribe = (cb: () => void) => {
  window.addEventListener(OAI_CONSENT_EVENT, cb);
  return () => window.removeEventListener(OAI_CONSENT_EVENT, cb);
};
// "server" while rendering on the server / hydrating, then the real answer in the browser
const snapshot = () => (oaiConsented() ? "yes" : "no");

export default function SiteAnalytics() {
  const pathname = usePathname() || "/";
  const consent = useSyncExternalStore(subscribe, snapshot, () => "server");
  if (consent === "server") return null;
  // visitor on /en or /fr without consent: don't even load the script
  if (consent === "no" && oaiNeedsConsent(pathname)) return null;
  // loaded on the Hebrew site and then moved to /en or /fr: drop those page views until consent
  const beforeSend = (e: BeforeSendEvent) => (oaiNeedsConsent(path(e.url)) && !oaiConsented() ? null : e);
  return <Analytics beforeSend={beforeSend} />;
}
