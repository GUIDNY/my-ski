import Link from "next/link";
import { badgeLight, card } from "@/components/ui";
import type { CardData } from "@/lib/intl/cards";
import { cardImage } from "@/lib/thumbs";

const IcoArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

/** One apartment in a grid: photo, name, size and guests, the price, a link to its page. */
export default function ApartmentCard({ c, cta, heading = "h2", eager = false }: {
  c: CardData; cta: string; heading?: "h2" | "h3"; eager?: boolean;
}) {
  const H = heading;
  const p = c.price;
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
        <H className="font-display font-bold text-[20px] md:text-[21px] leading-snug text-ink">{c.name}</H>
        <div className="text-[15px] text-muted">{c.meta}</div>
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
