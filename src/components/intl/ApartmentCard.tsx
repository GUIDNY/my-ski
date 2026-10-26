import Link from "next/link";
import type { ReactNode } from "react";
import { badgeLight, card } from "@/components/ui";
import type { CardData } from "@/lib/intl/cards";
import type { Lang } from "@/lib/intl/config";
import { cardImage } from "@/lib/thumbs";
import { QUARTER_NAME } from "./quarters";

const IcoArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/** One apartment in a grid: photo, name, size and guests, the price, a link to its page. */
const ico = (d: ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IcoUsers = () => ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>);
const IcoBed = () => ico(<><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" /><path d="M3 15h18M7 9V6h4v3" /></>);
const IcoSize = () => ico(<path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6" />);

const FACT = {
  en: { guests: (n: number) => `${n} guests`, studio: "Studio", beds: (n: number) => n === 1 ? "1 bedroom" : `${n} bedrooms`, ref: "Ref." },
  fr: { guests: (n: number) => `${n} pers.`, studio: "Studio", beds: (n: number) => n === 1 ? "1 chambre" : `${n} chambres`, ref: "Réf." },
};

export default function ApartmentCard({ c, cta, heading = "h2", eager = false, lang }: {
  c: CardData; cta: string; heading?: "h2" | "h3"; eager?: boolean; lang?: Lang;
}) {
  const H = heading;
  const p = c.price;
  const f = c.facts;
  const L = lang ? FACT[lang] : null;
  const where = f && (f.residence || f.quarter)
    ? [f.residence, f.quarter && lang ? QUARTER_NAME[lang][f.quarter]?.short : null].filter(Boolean).join(" · ") : "";
  return (
    <Link href={c.href} data-kind={c.kind}
      className={`${card} group overflow-hidden flex flex-col hover:border-line-strong transition-colors`}>
      <div className="relative h-[210px] bg-soft-2 overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...cardImage(c.img, "/apt1.jpg")} alt={c.name} loading={eager ? "eager" : "lazy"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className={`absolute top-3.5 start-3.5 ${badgeLight}`}>{c.badge}</span>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        {where && <div className="text-[13px] font-bold text-accent tracking-wide">{where}</div>}
        <H className="font-display font-bold text-[20px] md:text-[21px] leading-snug text-ink">{c.name}</H>
        {L && f ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted">
            {c.guests ? <span className="inline-flex items-center gap-1"><IcoUsers />{L.guests(c.guests)}</span> : null}
            {f.bed === "studio" ? <span className="inline-flex items-center gap-1"><IcoBed />{L.studio}</span>
              : f.beds ? <span className="inline-flex items-center gap-1"><IcoBed />{L.beds(f.beds)}</span> : null}
            {f.sqm ? <span className="inline-flex items-center gap-1"><IcoSize />{f.sqm} m²</span> : null}
            {f.code ? <span className="text-[13px]">{L.ref} {f.code}</span> : null}
          </div>
        ) : <div className="text-[15px] text-muted">{c.meta}</div>}
        <div className="mt-auto pt-3.5 border-t border-line flex flex-col gap-3">
          {"text" in p ? (
            <span className="text-[15px] text-muted min-h-[44px] flex items-center">{p.text}</span>
          ) : (
            <div className="flex items-baseline justify-between gap-x-3 gap-y-1 flex-wrap min-h-[44px]">
              <span className="flex items-baseline gap-1.5 flex-wrap">
                {p.prefix && <span className="text-[14px] text-muted">{p.prefix}</span>}
                <span className="font-display font-extrabold text-[26px] leading-none text-ink">{p.amount}</span>
                {p.unit && <span className="text-[14px] text-muted">{p.unit}</span>}
              </span>
              {p.sub && <span className="text-[14px] text-muted">{p.sub}</span>}
            </div>
          )}
          <span className="inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap bg-accent group-hover:bg-accent-hover text-white rounded-[14px] min-h-[48px] px-6 text-[16px] transition-colors w-full">
            {cta} <IcoArrow />
          </span>
        </div>
      </div>
    </Link>
  );
}
