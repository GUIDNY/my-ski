"use client";
import { btn, wrap } from "@/components/ui";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";

/** What an /en or /fr page shows when it can't be rendered (e.g. the database is unreachable). */
export default function IntlError({ lang, retry }: { lang: Lang; retry: () => void }) {
  const t = DICT[lang].error;
  return (
    <div className={`${wrap} flex-1 flex items-center justify-center py-20 md:py-28`}>
      <div role="alert" className="max-w-[520px] text-center flex flex-col items-center gap-4">
        <h1 className="font-display font-extrabold text-[30px] md:text-[38px] tracking-tight text-ink">{t.title}</h1>
        <p className="text-[16px] md:text-[17px] leading-relaxed text-muted">{t.text}</p>
        <button type="button" onClick={retry} className={`${btn.primary} mt-2`}>{t.retry}</button>
      </div>
    </div>
  );
}
