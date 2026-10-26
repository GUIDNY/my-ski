"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { Apartment } from "@/types";
import { getEffectivePrice, calcTotalForRange, matchingWeek } from "@/lib/pricing";
import type { PricingRule } from "@/lib/pricing";
import SkiCalendar from "@/components/SkiCalendar";
import { aptShortName, aptDisplayName, aptKind, aptParts, forWho, minWeekPrice } from "@/lib/apartment-display";
import { wrap, card, btn, badgeLight, Check, Crumbs, EmptyState, Skeleton } from "@/components/ui";
import { cardImage } from "@/lib/thumbs";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const day = (s: string) => new Date(s + "T12:00:00");
/** "16–23 בינואר" / "28 בפברואר – 7 במרץ" */
const rangeLabel = (ci: string, co: string) => {
  const a = day(ci), b = day(co);
  return a.getMonth() === b.getMonth()
    ? `\u2066${a.getDate()}\u2060–\u2060${b.getDate()}\u2069 ב${HE_MONTHS[b.getMonth()]}`
    : `${a.getDate()} ב${HE_MONTHS[a.getMonth()]} – ${b.getDate()} ב${HE_MONTHS[b.getMonth()]}`;
};
const eur = (n: number) => `€${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const isAgency = (apt: Apartment) => apt.source === "la_cime";
/** under the name: what it is and its size; weekly ones also their code */
const metaLine = (apt: Apartment) => isAgency(apt)
  ? [apt.sqm ? `${apt.sqm} מ"ר` : "", aptParts(apt).code ? `קוד ${aptParts(apt).code}` : ""].filter(Boolean).join(" · ")
  : [`${aptKind(apt)}${forWho(apt.max_guests) ? ` ${forWho(apt.max_guests)}` : ""}`, apt.sqm ? `${apt.sqm} מ"ר` : ""].filter(Boolean).join(" · ");

type Filter = "all" | "own" | "agency";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",    label: "הכל" },
  { key: "own",    label: "הדירות שלנו" },
  { key: "agency", label: "שבת עד שבת" },
];

const ico = (path: ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoCal = () => ico(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>, 16);
const IcoUsers = () => ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>, 16);
const IcoArrow = () => ico(<path d="M19 12H5M11 6l-6 6 6 6" />, 18);
const IcoClose = () => ico(<path d="M6 6l12 12M18 6L6 18" />, 20);

function ApartmentCard({ apt, checkin, checkout, guests, rules, fromNightPrice, priority = false }: {
  apt: Apartment; checkin: string; checkout: string; guests: number; rules: PricingRule[]; fromNightPrice?: number;
  /** one of the first cards on screen: its photo loads at once (the first is the page's largest paint) */
  priority?: boolean;
}) {
  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;

  // La Cime ("שבת עד שבת") apartments are only real inventory in fixed
  // Saturday-to-Saturday weeks, always charged the full week's real price —
  // same matchingWeek() rule /search and /apartments/[id] already use. Without
  // this, this card fell back to the generic seasonal pricing_rules estimate,
  // which showed a far-too-low price for high-season weeks (caught live: a
  // real ~€5000 week showing as ~€2,444 here).
  const weekMatch = matchingWeek(apt, checkin, checkout);
  const total = weekMatch
    ? weekMatch.price
    : checkin && checkout && nights > 0
      ? calcTotalForRange(checkin, checkout, apt.price_per_night, rules)
      : apt.price_per_night * nights;

  const minNightlyPrice = (() => {
    if (!checkin || !checkout) return apt.price_per_night;
    const end = new Date(checkout + "T12:00:00");
    let min = Infinity;
    for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1))
      min = Math.min(min, getEffectivePrice(new Date(d), apt.price_per_night, rules));
    return min === Infinity ? apt.price_per_night : min;
  })();

  // weekly apartments are rented by the week: without dates, their cheapest open week
  const fromWeek = isAgency(apt) ? minWeekPrice(apt) : null;

  // a plain address when nothing was chosen (the one search engines should index)
  const q = new URLSearchParams();
  if (checkin && checkout) { q.set("checkin", checkin); q.set("checkout", checkout); }
  if (q.size || guests !== 2) q.set("guests", String(guests));
  const query = q.toString();

  return (
    <Link href={`/apartments/${apt.id}${query ? `?${query}` : ""}`}
      className={`${card} group overflow-hidden flex flex-col hover:border-line-strong transition-colors`}>
      <div className="relative h-[210px] bg-soft-2 overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...cardImage(apt.images?.[0], "/apt1.jpg")} alt={aptDisplayName(apt)} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className={`absolute top-3.5 right-3.5 ${badgeLight}`}>{isAgency(apt) ? "שבת עד שבת" : "דירה שלנו"}</span>
      </div>

      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-bold text-[20px] md:text-[21px] leading-snug text-ink">{aptShortName(apt)}</h3>
        <div className="text-[15px] text-muted">{metaLine(apt) || "ואל טורנס"}</div>
        {(apt.amenities?.length ?? 0) > 0 && (
          <ul className="flex flex-col gap-1.5 text-[14px] text-ink">
            {apt.amenities.slice(0, 3).map((a, i) => <li key={i} className="flex items-center gap-2"><Check size={15} />{a}</li>)}
          </ul>
        )}

        <div className="mt-auto pt-3.5 border-t border-line flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            {weekMatch ? (
              <>
                <span className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-[26px] leading-none text-ink">{eur(weekMatch.price)}</span>
                  <span className="text-[14px] text-muted">לשבוע</span>
                </span>
                <span className="text-[14px] text-muted">שבוע מלא</span>
              </>
            ) : nights > 0 ? (
              <>
                <span className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-[26px] leading-none text-ink">{eur(total)}</span>
                  <span className="text-[14px] text-muted">ל-{nights} לילות</span>
                </span>
                <span className="text-[14px] text-muted">מ-{eur(minNightlyPrice)} ללילה</span>
              </>
            ) : !isAgency(apt) && fromNightPrice ? (
              <>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[14px] text-muted">מ-</span>
                  <span className="font-display font-extrabold text-[26px] leading-none text-ink">{eur(fromNightPrice)}</span>
                  <span className="text-[14px] text-muted">ללילה</span>
                </span>
                <span className="text-[14px] text-muted">לפי התאריכים</span>
              </>
            ) : isAgency(apt) && fromWeek ? (
              <>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[14px] text-muted">מ-</span>
                  <span className="font-display font-extrabold text-[26px] leading-none text-ink">{eur(fromWeek)}</span>
                  <span className="text-[14px] text-muted">לשבוע</span>
                </span>
                <span className="text-[14px] text-muted">שבת עד שבת</span>
              </>
            ) : (
              <>
                <span className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-[26px] leading-none text-ink">{eur(apt.price_per_night)}</span>
                  <span className="text-[14px] text-muted">ללילה</span>
                </span>
                {isAgency(apt) && <span className="text-[14px] text-muted">שבת עד שבת</span>}
              </>
            )}
          </div>
          <span className={`${btn.primary} w-full`}>לדירה <IcoArrow /></span>
        </div>
      </div>
    </Link>
  );
}

/* ── Dates dialog ─────────────────────────────────────────── */
function CalendarOverlay({ guests, onApply, onClose }: {
  guests: number;
  onApply: (ci: string, co: string, g: number) => void;
  onClose: () => void;
}) {
  const [g, setG] = useState(guests);
  const cardRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const stepBtn = "w-11 h-11 rounded-full border border-line-strong flex items-center justify-center text-ink text-[18px] leading-none hover:border-ink transition-colors disabled:opacity-40";

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center md:p-4 bg-ink/45" role="dialog" aria-modal="true" aria-labelledby="dates-title">
      <div ref={cardRef} className="w-full md:max-w-[760px] max-h-[92dvh] overflow-y-auto bg-white rounded-t-[24px] md:rounded-card" dir="rtl">
        <div className="sticky top-0 z-10 bg-white px-5 md:px-6 pt-5 pb-4 border-b border-line flex items-start justify-between gap-4">
          <div>
            <h2 id="dates-title" className="font-display font-bold text-[22px] text-ink">מתי אתם באים?</h2>
            <p className="text-[14px] text-muted mt-0.5">עונת הסקי: 21 בנובמבר 2026 עד 2 במאי 2027</p>
          </div>
          <button type="button" onClick={onClose} aria-label="סגירה"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-soft transition-colors">
            <IcoClose />
          </button>
        </div>

        <div className="p-4 md:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line px-4 py-3">
            <span className="text-[15px] font-bold text-ink">כמה אתם?</span>
            <div className="flex items-center gap-2" role="group" aria-label="כמה אתם">
              <button type="button" className={stepBtn} onClick={() => setG(v => Math.max(1, v - 1))} disabled={g <= 1} aria-label="פחות אנשים">−</button>
              <span className="w-7 text-center font-bold text-[17px] text-ink" aria-live="polite">{g}</span>
              <button type="button" className={stepBtn} onClick={() => setG(v => Math.min(8, v + 1))} disabled={g >= 8} aria-label="עוד אנשים">+</button>
            </div>
          </div>
          <SkiCalendar
            onSelect={(from, to) => onApply(from, to, g)}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

function ApartmentsPage({ initialApartments, intro, fromNights = {} }: { initialApartments: Apartment[]; intro?: ReactNode; fromNights?: Record<string, number> }) {
  const params   = useSearchParams();
  const router   = useRouter();
  const checkin  = params.get("checkin")  ?? "";
  const checkout = params.get("checkout") ?? "";
  const guests   = parseInt(params.get("guests") ?? "2") || 2;

  // the list comes from the server, so the page (and search engines) get it at once
  const apartments = initialApartments;
  const loading = false;
  const [filter,     setFilter]     = useState<Filter>("all");
  const [showCal,    setShowCal]    = useState(false); // opens from the dates chip; the list shows without dates too
  const [rulesMap,   setRulesMap]   = useState<Record<string, PricingRule[]>>({});
  const [blockedFor, setBlockedFor] = useState<{ key: string; ids: string[] }>({ key: "", ids: [] });

  const applyDates = (ci: string, co: string, g: number) => {
    router.replace(`/apartments?checkin=${ci}&checkout=${co}&guests=${g}`);
    setShowCal(false);
  };

  // nightly prices for the chosen dates: only our own apartments are priced
  // per night (weekly ones by the week), and only once there are dates
  const datesChosen = !!(checkin && checkout);
  useEffect(() => {
    if (!datesChosen) return;
    const own = apartments.filter(a => a.source !== "la_cime");
    Promise.all(
      own.map(apt =>
        fetch(`/api/pricing-rules?apartment_id=${apt.id}`)
          .then(r => r.json())
          .then(r => [apt.id, Array.isArray(r) ? r : []] as [string, PricingRule[]])
          .catch(() => [apt.id, []] as [string, PricingRule[]])
      )
    ).then(entries => setRulesMap(Object.fromEntries(entries)));
  }, [apartments, datesChosen]);

  const rangeKey = checkin && checkout ? `${checkin}|${checkout}` : "";
  useEffect(() => {
    if (!rangeKey) return;
    let cancelled = false;
    fetch(`/api/availability/blocked?checkin=${checkin}&checkout=${checkout}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setBlockedFor({ key: rangeKey, ids: Array.isArray(d.blocked) ? d.blocked : [] }); })
      .catch(() => { if (!cancelled) setBlockedFor({ key: rangeKey, ids: [] }); });
    return () => { cancelled = true; };
  }, [rangeKey, checkin, checkout]);
  const blocked = rangeKey && blockedFor.key === rangeKey ? blockedFor.ids : [];

  const available = apartments.filter(a =>
    !blocked.includes(a.id) && (a.source !== "la_cime" || !checkin || !checkout || matchingWeek(a, checkin, checkout))
  );
  const shown = filter === "all" ? available : available.filter(a => (filter === "agency") === isAgency(a));
  const counts = { all: available.length, own: available.filter(a => !isAgency(a)).length, agency: available.filter(isAgency).length };

  const nights = checkin && checkout
    ? Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) : 0;
  const hasDates = !!(checkin && checkout);
  const searchHref = hasDates ? `/search?checkin=${checkin}&checkout=${checkout}&guests=${guests}` : "/search";

  return (
    <div className="flex-1 bg-white" dir="rtl">

      {showCal && (
        <CalendarOverlay
          guests={guests || 2}
          onApply={applyDates}
          onClose={() => setShowCal(false)}
        />
      )}

      {/* ── Page top ──────────────────────────────────────────── */}
      <div className="bg-soft border-b border-line">
        <div className={`${wrap} pt-6 md:pt-8 pb-7 md:pb-9`}>
          <Crumbs items={[{ label: "דף הבית", href: "/" }, { label: "דירות" }]} className="mb-3 md:mb-4" />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <h1 className="font-display font-extrabold text-[32px] leading-[1.1] md:text-[44px] tracking-tight text-ink">דירות בואל טורנס</h1>
              <p className="text-[16px] md:text-[17px] text-muted">
                {loading ? "טוענים את הדירות…" : `${shown.length} ${shown.length === 1 ? "דירה" : "דירות"}${hasDates ? " פנויות לתאריכים שבחרתם" : ""}. הדירות שלנו, ודירות לשבוע שלם.`}
              </p>
              {intro && !hasDates && <div className="max-w-[760px] flex flex-col gap-2 text-[15px] md:text-[16px] leading-relaxed text-body">{intro}</div>}
            </div>
            <Link href={searchHref} className={`${btn.link} text-[16px]`}>לחיפוש חבילות <IcoArrow /></Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowCal(true)}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white border border-line-strong text-[15px] font-bold text-ink hover:border-ink transition-colors">
              <span className="text-accent"><IcoCal /></span>
              {hasDates ? <>{rangeLabel(checkin, checkout)}{nights > 0 ? ` · ${nights} לילות` : ""}</> : "בחרו תאריכים"}
            </button>
            <button type="button" onClick={() => setShowCal(true)}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white border border-line-strong text-[15px] font-bold text-ink hover:border-ink transition-colors">
              <span className="text-accent"><IcoUsers /></span>
              {guests} {guests === 1 ? "אדם" : "אנשים"}
            </button>
          </div>
        </div>
      </div>

      <div className={`${wrap} pt-6 md:pt-8 pb-16 md:pb-20`}>
        {/* ── Filters ───────────────────────────────────────── */}
        {!loading && apartments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="סוג הדירה">
            {FILTERS.map(f => (
              <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}
                className={`min-h-[44px] px-4 rounded-full border text-[15px] font-bold transition-colors ${
                  filter === f.key ? "bg-ink border-ink text-white" : "bg-white border-line-strong text-ink hover:border-ink"
                }`}>
                {f.label} <span className={filter === f.key ? "text-white/70" : "text-muted"}>{counts[f.key]}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Grid ──────────────────────────────────────────── */}
        <h2 className="sr-only">{hasDates ? "הדירות הפנויות לתאריכים שבחרתם" : "כל הדירות בואל טורנס"}</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`${card} overflow-hidden`}>
                <Skeleton className="rounded-none h-[210px]" />
                <div className="p-5 flex flex-col gap-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-11 w-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            title={hasDates ? "אין דירות פנויות לתאריכים האלה" : "לא מצאנו דירות"}
            text={hasDates ? "נסו תאריכים אחרים, או את כל סוגי הדירות." : undefined}
            action={<>
              {filter !== "all" && <button type="button" onClick={() => setFilter("all")} className={btn.outline}>לכל הדירות</button>}
              <button type="button" onClick={() => setShowCal(true)} className={btn.primary}>לבחור תאריכים</button>
            </>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {shown.map((apt, i) => (
              <ApartmentCard key={apt.id} apt={apt} checkin={checkin} checkout={checkout} guests={guests} rules={rulesMap[apt.id] ?? []} fromNightPrice={fromNights[apt.id]} priority={i < 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApartmentsClient({ initialApartments, intro, fromNights }: { initialApartments: Apartment[]; intro?: ReactNode; fromNights?: Record<string, number> }) {
  return (
    <Suspense fallback={<SkiLoader />}>
      <ApartmentsPage initialApartments={initialApartments} intro={intro} fromNights={fromNights} />
    </Suspense>
  );
}
