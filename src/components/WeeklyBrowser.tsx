"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Apartment, SkiPass } from "@/types";
import { hasDirectFlightBothWays } from "@/lib/direct-flight-days";
import { weekPackageExtras, PASS_AREA_LABEL } from "@/lib/deal-pricing";
import { useDirectFlight } from "@/lib/useFlightPrice";
import { aptDisplayName, aptShortName, aptParts, forWho } from "@/lib/apartment-display";
import { card, btn, badgeLight, badgeDark, Check, EmptyState } from "@/components/ui";
import { cardImage } from "@/lib/thumbs";
import { HOLIDAY_WEEKS } from "@/lib/holiday-weeks";

const MONTHS_FULL = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function fmtDate(d: Date) {
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

/** "12–19 בדצמבר" / "27 בפברואר – 6 במרץ" */
function fmtRange(a: Date, b: Date) {
  return a.getMonth() === b.getMonth()
    ? `\u2066${a.getDate()}\u2060–\u2060${b.getDate()}\u2069 ב${MONTHS_FULL[b.getMonth()]}`
    : `${a.getDate()} ב${MONTHS_FULL[a.getMonth()]} – ${b.getDate()} ב${MONTHS_FULL[b.getMonth()]}`;
}

const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function weekRange(iso: string) {
  const checkin = new Date(iso + "T12:00:00");
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 7);
  return { checkin, checkout, checkoutIso: isoOf(checkout) };
}

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

const ico = (path: ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoCal = () => ico(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
const IcoUsers = () => ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>);
const IcoPlane = ({ size = 14 }: { size?: number }) => ico(<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />, size);
const IcoChevron = () => ico(<path d="M6 9l6 6 6-6" />, 18);
const IcoArrow = () => ico(<path d="M19 12H5M11 6l-6 6 6 6" />, 18);

/*
 * La Cime weeks (Saturday to Saturday). Every price is per person for the
 * group size chosen: the apartment alone, or with "דיל שלם" the apartment +
 * the ski pass that fits the week + the transfer, all real prices. A flight
 * is never folded in with a guess: weeks with a direct flight both ways get
 * a plane, and for the chosen week the live direct price shows on its own line.
 */
export default function WeeklyBrowser({
  apartments,
  initialDeal = "apartment",
  initialWeek = null,
  initialGuests = 2,
  passes = [],
}: {
  apartments: Apartment[];
  initialDeal?: "apartment" | "full";
  /** a week to open on (from a link like /weekly?week=2027-01-16) */
  initialWeek?: string | null;
  /** how many people (from a link like /weekly?guests=4) */
  initialGuests?: number;
  passes?: SkiPass[];
}) {
  const allWeeks = useMemo(() => {
    const set = new Set<string>();
    for (const apt of apartments) for (const w of apt.available_weeks ?? []) set.add(w.week);
    return [...set].sort();
  }, [apartments]);

  const [selected, setSelected] = useState<string | null>(
    initialWeek && allWeeks.includes(initialWeek) ? initialWeek : allWeeks[0] ?? null);
  const [guests, setGuests] = useState(initialGuests);
  const [open, setOpen] = useState(false);
  const [dealMode, setDealMode] = useState<"apartment" | "full">(initialDeal);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // the cheapest apartment of each week that fits the group
  const weekMinPrice = useMemo(() => {
    const map = new Map<string, number>();
    for (const apt of apartments) {
      if ((apt.max_guests ?? 0) < guests) continue;
      for (const w of apt.available_weeks ?? []) {
        const cur = map.get(w.week);
        if (cur === undefined || w.price < cur) map.set(w.week, w.price);
      }
    }
    return map;
  }, [apartments, guests]);

  const visible = useMemo(() => {
    if (!selected) return [];
    return apartments
      .filter(apt => (apt.max_guests ?? 0) >= guests)
      .map(apt => {
        const match = (apt.available_weeks ?? []).find(w => w.week === selected);
        return match ? { apt, price: match.price } : null;
      })
      .filter((x): x is { apt: Apartment; price: number } => x !== null)
      .sort((a, b) => a.price - b.price);
  }, [apartments, selected, guests]);

  const full = dealMode === "full";
  const range = selected ? weekRange(selected) : null;
  const extras = (weekIso: string) => weekPackageExtras(passes, weekIso);
  /** what one person pays for the week, for the apartment's price */
  const perPerson = (aptPrice: number, weekIso: string) =>
    Math.round(aptPrice / guests + (full ? extras(weekIso).perPerson : 0));
  const groupTotal = (aptPrice: number, weekIso: string) =>
    Math.round(aptPrice + (full ? extras(weekIso).perPerson * guests : 0));

  // the live direct flight, only for the chosen week of a package
  const live = useDirectFlight(full && range ? selected! : "", full && range ? range.checkoutIso : "");
  /** a plane on weeks with a direct flight both ways (the checked schedule), unless the live check said there is none */
  const weekHasDirect = (w: string) =>
    hasDirectFlightBothWays(w, weekRange(w).checkoutIso) && !(w === selected && live.status === "none");

  if (!allWeeks.length) {
    return (
      <EmptyState title="אין כרגע שבועות פנויים" text="הדירות לשבוע מתעדכנות כל יום. אפשר לחזור לכאן בקרוב, או לחפש בדירות שלנו." />
    );
  }

  const rawFrom = selected ? weekMinPrice.get(selected) : undefined;
  const fromPrice = rawFrom !== undefined && selected ? perPerson(rawFrom, selected) : undefined;
  const selExtras = selected ? extras(selected) : null;
  const stepBtn = "w-10 h-10 rounded-full border border-line-strong flex items-center justify-center text-ink text-[18px] leading-none hover:border-ink transition-colors disabled:opacity-40";

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {/* ── Controls: week, guests, deal type ───────────────── */}
      <div className={`${card} p-3 md:p-4`}>
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-stretch gap-2">
          <div ref={ref} className="relative md:flex-[1_1_300px]">
            <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="listbox"
              className={`w-full h-full flex items-center justify-between gap-3 min-h-[56px] px-4 rounded-xl border text-right transition-colors ${open ? "border-accent bg-accent-soft" : "border-line-strong bg-white hover:border-ink"}`}>
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="text-accent shrink-0"><IcoCal /></span>
                <span className="flex flex-col leading-tight min-w-0">
                  <span className="text-[12px] font-bold text-muted">איזה שבוע?</span>
                  <span className="text-[16px] font-bold text-ink truncate">
                    {range ? `${fmtRange(range.checkin, range.checkout)} · 7 לילות` : "בחרו שבוע"}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-2 shrink-0 text-muted">
                {fromPrice !== undefined && <span className="hidden sm:inline text-[14px]">מ-<b className="text-ink">{eur(fromPrice)}</b> לאדם</span>}
                <IcoChevron />
              </span>
            </button>

            {/* ══ Week list ══ */}
            {open && (
              <div role="listbox" aria-label="השבועות הפנויים"
                className="absolute top-full mt-2 inset-x-0 z-40 bg-white rounded-2xl border border-line shadow-pop max-h-[min(420px,60dvh)] overflow-y-auto p-2">
                {allWeeks.map(w => {
                  const isSelected = selected === w;
                  const rp = weekMinPrice.get(w);
                  const { checkin, checkout } = weekRange(w);
                  return (
                    <button key={w} type="button" role="option" aria-selected={isSelected}
                      onClick={() => { setSelected(w); setOpen(false); }}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 min-h-[48px] text-right transition-colors ${isSelected ? "bg-accent-soft" : "hover:bg-soft"}`}>
                      <span className="flex items-center gap-2 text-[15px] text-ink">
                        {isSelected ? <Check /> : <span className="w-4" aria-hidden="true" />}
                        {fmtRange(checkin, checkout)}
                        {full && weekHasDirect(w) && <span className="text-muted" title="יש טיסה ישירה הלוך וחזור בשבוע הזה"><IcoPlane /></span>}
                        {HOLIDAY_WEEKS[w] && <span className="text-[12px] font-bold text-accent bg-accent-soft rounded-full px-2 py-0.5">{HOLIDAY_WEEKS[w].label}</span>}
                      </span>
                      {rp !== undefined
                        ? <span className="text-[15px] text-ink">מ-<b>{eur(perPerson(rp, w))}</b> <span className="text-muted text-[14px]">לאדם</span></span>
                        : <span className="text-[14px] text-muted">אין מקום ל-{guests}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:flex-[0_0_auto] flex items-center justify-between gap-4 min-h-[56px] px-4 rounded-xl border border-line-strong bg-white">
            <span className="flex items-center gap-2.5">
              <span className="text-accent"><IcoUsers /></span>
              <span className="text-[15px] font-bold text-ink whitespace-nowrap">כמה אתם?</span>
            </span>
            <div className="flex items-center gap-2" role="group" aria-label="כמה אתם">
              <button type="button" className={stepBtn} onClick={() => setGuests(g => Math.max(1, g - 1))} disabled={guests <= 1} aria-label="פחות אנשים">−</button>
              <span className="w-6 text-center font-bold text-[17px] text-ink" aria-live="polite">{guests}</span>
              <button type="button" className={stepBtn} onClick={() => setGuests(g => Math.min(12, g + 1))} disabled={guests >= 12} aria-label="עוד אנשים">+</button>
            </div>
          </div>

          <div className="md:flex-[0_1_260px] flex gap-1 p-1 rounded-xl border border-line-strong bg-white" role="group" aria-label="מה בא לכם?">
            {([["full", "דיל שלם"], ["apartment", "רק דירה"]] as const).map(([v, label]) => (
              <button key={v} type="button" aria-pressed={dealMode === v} onClick={() => setDealMode(v)}
                className={`flex-1 min-h-[46px] px-3 rounded-[10px] text-[15px] font-bold transition-colors ${dealMode === v ? "bg-ink text-white" : "text-ink hover:bg-soft"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* quick week chips: the lowest price per person that week */}
        {allWeeks.length > 1 && (
          <div className="mt-3 -mx-3 md:-mx-4 px-3 md:px-4 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {allWeeks.map(w => {
              const isSelected = selected === w;
              const rp = weekMinPrice.get(w);
              const { checkin } = weekRange(w);
              return (
                <button key={w} type="button" onClick={() => setSelected(w)} aria-pressed={isSelected}
                  className={`shrink-0 flex flex-col items-center justify-center min-h-[56px] px-4 rounded-2xl border transition-colors ${
                    isSelected ? "bg-ink border-ink text-white" : "bg-white border-line-strong text-ink hover:border-ink"
                  }`}>
                  <span className="text-[15px] font-bold flex items-center gap-1">
                    שבת {fmtDate(checkin)}
                    {full && weekHasDirect(w) && <span className={isSelected ? "text-white/80" : "text-muted"} title="יש טיסה ישירה הלוך וחזור בשבוע הזה"><IcoPlane size={12} /></span>}
                  </span>
                  <span className={`text-[13px] ${isSelected ? "text-white/80" : "text-muted"}`}>
                    {rp !== undefined ? `מ-${eur(perPerson(rp, w))} לאדם` : "אין מקום"}
                  </span>
                  {HOLIDAY_WEEKS[w] && (
                    <span className={`text-[12px] font-bold ${isSelected ? "text-white" : "text-accent"}`}>{HOLIDAY_WEEKS[w].label}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── What the price includes ─────────────────────────── */}
      <div className="bg-soft rounded-2xl px-4 py-3.5 md:px-5 text-[15px] leading-relaxed text-body">
        {full ? (
          <>המחיר לאדם כולל דירה לשבוע שלם (שבת עד שבת), סקי פס והסעה הלוך וחזור מהשדה, לפי מספר האנשים שבחרתם.
          טיסה לא כלולה במחיר: כשיש טיסה ישירה הלוך וחזור, השבוע מסומן במטוס ואת הטיסה מוסיפים בעמוד הדירה, במחיר האמיתי.</>
        ) : (
          <>המחיר הוא של הדירה בלבד, לשבוע שלם משבת עד שבת, מחולק לפי מספר האנשים. בדיל שלם המחיר לאדם כולל גם סקי פס והסעה.</>
        )}
      </div>

      {/* ── Results ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display font-bold text-[22px] md:text-[26px] text-ink">
          {visible.length === 1 ? "דירה אחת פנויה" : `${visible.length} דירות פנויות`}{range ? ` ל-${fmtRange(range.checkin, range.checkout)}` : ""}
        </h2>
        {visible.length > 1 && <span className="text-[14px] text-muted">מהזולה ליקרה</span>}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="אין דירה פנויה בשבוע הזה"
          text={guests > 1 ? `לא מצאנו דירה פנויה ל-${guests} אנשים בשבוע הזה. נסו שבוע אחר או פחות אנשים בדירה.` : "נסו שבוע אחר."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {visible.map(({ apt, price }, i) => {
            const pp = perPerson(price, selected!);
            const total = groupTotal(price, selected!);
            const href = `/apartments/${apt.id}?${new URLSearchParams({
              checkin: selected!,
              checkout: range!.checkoutIso,
              guests: String(guests),
              ...(full ? { deal: "full" } : {}),
            }).toString()}`;
            const meta = [aptParts(apt).title ? forWho(apt.max_guests) : "", apt.sqm ? `${apt.sqm} מ"ר` : "", aptParts(apt).code ? `קוד ${aptParts(apt).code}` : ""].filter(Boolean).join(" · ");
            return (
              <Link key={apt.id} href={href}
                className={`${card} group overflow-hidden flex flex-col hover:border-line-strong transition-colors`}>
                <div className="relative h-[210px] bg-soft-2 overflow-hidden">
                  {apt.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img {...cardImage(apt.images[0], "/apt1.jpg")} alt={aptDisplayName(apt)} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  )}
                  <span className={`absolute top-3.5 right-3.5 ${badgeLight}`}>שבת עד שבת</span>
                  {i === 0 && visible.length > 1 && <span className={`absolute top-3.5 left-3.5 ${badgeDark}`}>הכי משתלם</span>}
                </div>
                <div className="p-5 flex flex-col gap-2.5 flex-1">
                  <h3 className="font-display font-bold text-[20px] md:text-[21px] leading-snug text-ink">{aptShortName(apt)}</h3>
                  {meta && <div className="text-[15px] text-muted">ואל טורנס · {meta}</div>}
                  {full && (
                    <ul className="flex flex-col gap-1.5 text-[15px] text-ink">
                      <li className="flex items-center gap-2"><Check />דירה לשבוע, שבת עד שבת</li>
                      {selExtras?.area && selExtras.tier && (
                        <li className="flex items-center gap-2"><Check />סקי פס {PASS_AREA_LABEL[selExtras.area]}, {selExtras.tier.duration_days} ימים</li>
                      )}
                      <li className="flex items-center gap-2"><Check />הסעה הלוך וחזור מהשדה</li>
                      {live.status === "found" && live.flight ? (
                        <li className="flex items-start gap-2 text-body"><span className="mt-0.5 text-accent shrink-0"><IcoPlane size={15} /></span>
                          <span>טיסה ישירה הלוך וחזור ל{live.flight.city}: עוד {eur(live.flight.price)} לאדם, מוסיפים בעמוד הדירה</span></li>
                      ) : live.status === "loading" && weekHasDirect(selected!) ? (
                        <li className="flex items-center gap-2 text-muted"><span className="shrink-0"><IcoPlane size={15} /></span>בודקים טיסה ישירה…</li>
                      ) : null}
                    </ul>
                  )}
                  <div className="mt-auto pt-3.5 border-t border-line flex flex-col gap-3">
                    {full ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-display font-extrabold text-[30px] leading-none text-ink">{eur(pp)}</span>
                          <span className="text-[15px] text-muted">לאדם</span>
                        </div>
                        <span className="text-[14px] text-muted">{eur(total)} לכל החבורה, {guests} {guests === 1 ? "אדם" : "אנשים"}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-display font-extrabold text-[30px] leading-none text-ink">{eur(total)}</span>
                          <span className="text-[15px] text-muted">לשבוע</span>
                        </div>
                        <span className="text-[14px] text-muted">{eur(pp)} לאדם, {guests} {guests === 1 ? "אדם" : "אנשים"}</span>
                      </div>
                    )}
                    <span className={`${btn.primary} w-full`}>{full ? "לחבילה" : "לדירה"} <IcoArrow /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
