"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rememberSource, currentSource, sourceLine, SOURCE_TAG } from "@/lib/attribution";

/*
 * Remembers where the visitor came from, and adds it as the last line of every
 * WhatsApp message started from the site ("מקור: Google Ads"), so the lead in
 * the leads screen shows its source. Not in the staff areas.
 */
export default function Attribution() {
  const pathname = usePathname() || "/";
  useEffect(() => {
    if (/^\/(admin|seller)/.test(pathname)) return;
    rememberSource();
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (/^\/(admin|seller)/.test(window.location.pathname)) return;
      const a = (e.target as Element | null)?.closest?.("a") as HTMLAnchorElement | null;
      if (!a || !/(wa\.me|api\.whatsapp\.com|whatsapp:\/\/)/.test(a.href)) return;
      const s = currentSource();
      if (!s) return;
      try {
        const u = new URL(a.href);
        const text = u.searchParams.get("text") || "";
        if (text.includes(SOURCE_TAG)) return;
        u.searchParams.set("text", `${text}${text ? "\n\n" : ""}${sourceLine(s)}`);
        a.href = u.toString();
      } catch { /* leave the link as it is */ }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
