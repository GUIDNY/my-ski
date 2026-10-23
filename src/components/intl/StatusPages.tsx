import Link from "next/link";
import { btn, wrap } from "@/components/ui";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";

/** The /en and /fr 404 page (inside their frame). */
export function IntlNotFound({ lang }: { lang: Lang }) {
  const t = DICT[lang].notFound;
  return (
    <div className={`${wrap} flex-1 flex items-center justify-center py-20 md:py-28`}>
      <div className="max-w-[520px] text-center flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/skishare-mark.png" alt="" aria-hidden="true" className="h-10 w-auto opacity-80" />
        <h1 className="font-display font-extrabold text-[32px] md:text-[40px] tracking-tight text-ink">{t.title}</h1>
        <p className="text-[16px] md:text-[17px] leading-relaxed text-muted">{t.text}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Link href={`/${lang}/apartments`} className={btn.primary}>{t.apartments}</Link>
          <Link href={`/${lang}`} className={btn.outline}>{t.home}</Link>
        </div>
      </div>
    </div>
  );
}

/** While a page loads: the mountain mark and a moving bar, like components/SkiLoader.tsx. */
export function IntlLoading({ lang }: { lang: Lang }) {
  return (
    <div className="flex-1 min-h-[60vh] w-full flex flex-col items-center justify-center bg-white" role="status" aria-live="polite">
      <style>{`
        @keyframes intl-bar { 0% { transform: translateX(-110%) } 100% { transform: translateX(210%) } }
        @keyframes intl-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        @media (prefers-reduced-motion: reduce) { .intl-anim { animation: none !important } }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/skishare-mark.png" alt="" aria-hidden="true" className="intl-anim h-10 w-auto opacity-90"
        style={{ animation: "intl-float 1.6s ease-in-out infinite" }} />
      <div className="mt-5 h-1.5 w-40 rounded-full bg-soft-2 overflow-hidden">
        <div className="intl-anim h-full w-1/2 rounded-full bg-accent" style={{ animation: "intl-bar 1.2s ease-in-out infinite" }} />
      </div>
      <p className="mt-4 text-[15px] font-medium text-muted">{DICT[lang].loading}</p>
    </div>
  );
}
