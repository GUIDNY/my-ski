import { faqLd, ldJson } from "@/lib/site";
import Link from "next/link";
import type { ReactNode } from "react";
import { wrap } from "@/components/ui";
import { cardsFor } from "@/lib/intl/cards";
import { CONTACT_EMAIL, type Lang } from "@/lib/intl/config";
import { getApartments, getRules, todayIso } from "@/lib/intl/data";
import { buildItems } from "@/lib/intl/items";
import { DICT } from "@/lib/intl/dict";

// the other languages named in this page's language ("also in Hebrew and French")
const LANG_IN = {
  en: { he: "Hebrew", fr: "French", en: "English" },
  fr: { he: "hébreu", en: "anglais", fr: "français" },
} as const;
import { isAgencyApt } from "@/lib/intl/pricing-view";
import { parseSearch } from "@/lib/intl/search";
import ApartmentCard from "./ApartmentCard";
import SearchBar from "./SearchBar";

const ico = (path: ReactNode, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const WHY_ICONS = [
  ico(<><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>),
  ico(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>),
  ico(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  ico(<path d="m8 3 4 8 5-5 5 15H2L8 3z" />),
];

/** /en and /fr: the hero search, why us, our apartments (server-rendered), the resort and a short FAQ. */
export default async function HomePage({ lang }: { lang: Lang }) {
  const t = DICT[lang];
  const h = t.home;
  const today = todayIso();
  const apartments = await getApartments();
  const rules = apartments ? await getRules(apartments.filter(a => !isAgencyApt(a)).map(a => a.id)) : null;
  const items = apartments ? buildItems(lang, apartments, rules, today) : [];
  const all = cardsFor({ lang, items, search: parseSearch({}, today), taken: null, todayIso: today });
  const own = all.filter(c => c.kind === "own");
  const others = (["he", "en", "fr"] as const).filter(l => l !== lang);

  return (
    <div className="bg-white text-ink">
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative flex items-center min-h-[540px] md:min-h-[600px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-ski.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "rgba(8,18,38,0.46)" }} />
        <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 pt-12 pb-14 md:pt-16 md:pb-20 flex flex-col items-center gap-5 md:gap-6 text-center">
          <span className="rounded-full px-4 py-1.5 text-[14px] md:text-[15px] font-medium text-white"
            style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.32)" }}>
            {h.badge}
          </span>
          <h1 className="font-display font-extrabold text-white text-[40px] leading-[1.08] md:text-[64px] md:leading-[1.05] tracking-tight" style={{ textWrap: "balance" }}>
            {h.title}
          </h1>
          <p className="text-[17px] md:text-[22px] leading-relaxed text-[#F1F5FB] max-w-[720px]">{h.sub}</p>
          <SearchBar lang={lang} todayIso={today} />
        </div>
      </section>

      {/* ── Why us ─────────────────────────────────────── */}
      <section aria-labelledby="why-title" className="bg-soft border-b border-line">
        <div className={`${wrap} py-8 md:py-10`}>
          <h2 id="why-title" className="font-display font-bold text-[22px] md:text-[26px] tracking-tight mb-5 md:mb-6">{h.why}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {h.whyItems.map((w, i) => (
              <li key={w.title} className="flex gap-3.5 items-start">
                <span className="shrink-0 w-11 h-11 rounded-xl bg-white border border-line flex items-center justify-center text-accent">{WHY_ICONS[i]}</span>
                <div>
                  <div className="font-bold text-[16px] md:text-[17px]">{w.title}</div>
                  <div className="text-[14px] md:text-[15px] text-muted mt-0.5 leading-relaxed">{w.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Our apartments ─────────────────────────────── */}
      <section aria-labelledby="apts-title" className={`${wrap} pt-14 md:pt-20 pb-4`}>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-8">
          <div className="flex flex-col gap-2 min-w-0">
            <h2 id="apts-title" className="font-display text-[28px] md:text-[38px] font-bold tracking-tight">{h.aptsTitle}</h2>
            <p className="text-[16px] md:text-[17px] text-muted">{h.aptsSub}</p>
          </div>
        </div>
        {own.length === 0 ? (
          <p className="rounded-2xl bg-soft border border-line px-5 py-6 text-[16px] text-body">{h.noApts}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {own.map(c => <ApartmentCard key={c.id} c={c} cta={t.common.viewApt} heading="h3" />)}
          </div>
        )}
        {all.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link href={`/${lang}/apartments`}
              className="inline-flex items-center justify-center gap-2 font-bold bg-white border border-line-strong hover:border-ink text-ink rounded-[14px] min-h-[48px] px-6 text-[16px] transition-colors">
              {h.allApts(all.length)}
            </Link>
            <span className="text-[15px] text-muted">{h.allAptsNote}</span>
          </div>
        )}
      </section>

      {/* ── The resort ─────────────────────────────────── */}
      <section className="bg-soft mt-14 md:mt-20">
        <div className={`${wrap} py-14 md:py-20 flex flex-wrap gap-10 md:gap-14 items-center`}>
          <div className="flex-[1_1_440px] min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/view.jpg" alt={h.resortImgAlt} loading="lazy" className="w-full h-[260px] md:h-[420px] object-cover rounded-[26px] block" />
          </div>
          <div className="flex-[1_1_420px] min-w-0 flex flex-col gap-4">
            <span className="text-[15px] font-bold text-accent">{h.resortKicker}</span>
            <h2 className="font-display text-[28px] md:text-[38px] font-bold leading-tight tracking-tight">{h.resortTitle}</h2>
            <p className="text-[16px] md:text-[18px] leading-[1.65] text-body">{h.resortText}</p>
            <ul className="grid grid-cols-2 gap-3 mt-1">
              {h.facts.map(f => (
                <li key={f.label} className={`bg-white border border-line rounded-[18px] p-4 ${f.small ? "col-span-2" : ""}`}>
                  <div className={`font-display font-extrabold ${f.small ? "text-[18px] md:text-[21px] leading-snug" : "text-[22px] md:text-[26px]"}`}>{f.value}</div>
                  <div className="text-[14px] md:text-[15px] text-muted">{f.label}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <section aria-labelledby="faq-title" className="max-w-[920px] mx-auto w-full px-4 md:px-6 py-14 md:py-20">
        {/* the same questions and answers as shown, for search engines and AI answers */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqLd(h.faqItems.map(f => ({ q: f.q, a: f.a })))) }} />
        <h2 id="faq-title" className="font-display text-[28px] md:text-[38px] font-bold tracking-tight mb-6">{h.faq}</h2>
        <div className="flex flex-col border-t border-line">
          {h.faqItems.map((f, i) => (
            <details key={f.q} open={i === 0} className="border-b border-line group">
              <summary className="font-bold text-[17px] md:text-[19px] cursor-pointer list-none flex items-center justify-between gap-4 min-h-[56px] py-3">
                {f.q}
                <span aria-hidden="true" className="text-muted text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 text-[16px] md:text-[17px] leading-[1.65] text-body">
                {f.a}
                {"link" in f && f.link && <> <Link href={`/${lang}/terms`} className="font-bold text-accent hover:text-accent-hover">{f.link}</Link></>}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-[15px] text-muted">
          {h.contactQ} <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-accent hover:text-accent-hover wrap-anywhere">{CONTACT_EMAIL}</a>
        </p>
        <p className="mt-3 text-[15px] text-muted">
          {h.alsoIn}{" "}
          {/* full page loads: each language has its own frame */}
          <a href={others[0] === "he" ? "/" : `/${others[0]}`} hrefLang={others[0]} className="font-bold text-accent hover:text-accent-hover">{LANG_IN[lang][others[0]]}</a>
          {" "}{h.and}{" "}
          <a href={others[1] === "he" ? "/" : `/${others[1]}`} hrefLang={others[1]} className="font-bold text-accent hover:text-accent-hover">{LANG_IN[lang][others[1]]}</a>.
        </p>
      </section>
    </div>
  );
}
