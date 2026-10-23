"use client";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { pathInLang } from "@/lib/intl/config";

/*
 * "English · Français" in the Hebrew footer: the same page in that language
 * when it has one (an apartment keeps its dates), else that language's home.
 * Plain <a> links: each language has its own frame, so it's a full page load.
 */
function Links({ search }: { search: string }) {
  const pathname = usePathname() || "/";
  const href = (to: "en" | "fr") => pathInLang(pathname, search, to);
  return (
    <span dir="ltr" className="inline-flex items-center gap-1.5">
      <a href={href("en")} hrefLang="en" lang="en" className="inline-flex items-center min-h-[44px] hover:text-ink transition-colors">English</a>
      <span aria-hidden="true">·</span>
      <a href={href("fr")} hrefLang="fr" lang="fr" className="inline-flex items-center min-h-[44px] hover:text-ink transition-colors">Français</a>
    </span>
  );
}

function WithQuery() {
  const q = useSearchParams().toString();
  return <Links search={q ? `?${q}` : ""} />;
}

export default function FooterLangLinks() {
  return (
    <Suspense fallback={<Links search="" />}>
      <WithQuery />
    </Suspense>
  );
}
