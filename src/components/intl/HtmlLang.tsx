"use client";
import { useLayoutEffect } from "react";
import { HE_HTML, type Lang } from "@/lib/intl/config";

/**
 * Keeps <html lang dir> right for the English and French pages after client
 * navigations: set when this frame mounts, put back to the root layout's
 * Hebrew values (lang="he" dir="rtl") when it unmounts. The first paint is
 * covered by the inline script in IntlShell.
 */
export default function HtmlLang({ lang }: { lang: Lang }) {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = "ltr";
    return () => {
      html.lang = HE_HTML.lang;
      html.dir = HE_HTML.dir;
    };
  }, [lang]);
  return null;
}
