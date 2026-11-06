"use client";
import { useEffect } from "react";
import { oaiConsented, oaiNeedsConsent } from "@/lib/oai-pixel";

/*
 * Consent rule for Vercel Web Analytics (<Analytics /> in the root layout):
 * on the English/French site (/en, /fr) no page view is sent before the
 * visitor agreed to cookies. Registered through window.va("beforeSend"),
 * the same queue the <Analytics beforeSend> prop uses (the layout is a
 * server component and can't pass a function).
 */
type VaFn = ((...a: unknown[]) => void) & { q?: unknown[] };
const path = (url: string) => { try { return new URL(url).pathname; } catch { return "/"; } };

export default function AnalyticsConsent() {
  useEffect(() => {
    const w = window as unknown as { va?: VaFn; vaq?: unknown[][] };
    // the package's own queue stub, in case this runs before <Analytics /> set it
    w.va ||= (...params: unknown[]) => { (w.vaq ||= []).push(params); };
    w.va("beforeSend", (e: { url: string }) => (oaiNeedsConsent(path(e.url)) && !oaiConsented() ? null : e));
  }, []);
  return null;
}
