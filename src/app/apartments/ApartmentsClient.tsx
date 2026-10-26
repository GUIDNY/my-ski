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
import { aptShortName, aptDisplayName, aptParts, minWeekPrice } from "@/lib/apartment-display";
import { wrap, card, btn, badgeLight, Check, Crumbs, EmptyState, Skeleton } from "@/components/ui";
import { cardImage } from "@/lib/thumbs";
import { placeOf, bedroomsOf, QUARTER_HE } from "@/lib/residences";

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
type Filter = "all" | "own" | "agency";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",    label: "הכל" },
  { key: "own",    label: "הדירות שלנו" },
  { key: "agency", label: "שבת עד שבת" },
];

/** how many people the apartment is for: a range of its maximum */
type Size = "any" | "2" | "4" | "6" | "8" | "9";
const SIZES: { key: Size; label: string; fits: (n: number) => boolean }[] = [
  { key: "any", label: "כל הגדלים", fits: () => true },
  { key: "2", label: "עד 2", fits: n => n <= 2 },
  { key: "4", label: "3–4", fits: n => n >= 3 && n <= 4 },
  { key: "6", label: "5–6", fits: n => n >= 5 && n <= 6 },
  { key: "8", label: "7–8", fits: n => n >= 7 && n <= 8 },
  { key: "9", label: "9 ומעלה", fits: n => n >= 9 },
];
type Sort = "rec" | "low" | "high" | "big" | "small";
const SORTS: { key: Sort; label: string }[] = [
  { key: "rec", label: "מומלצות" },
  { key: "low", label: "מחיר: מהזול ליקר" },
  { key: "high", label: "מחיר: מהיקר לזול" },
  { key: "big", label: "הכי גדולות" },
  { key: "small", label: "הכי קטנות" },
];
const PER_PAGE = [12, 24, 48] as const;
/** the price of a week (nightly apartments × 7) */
const PRICES: { key: string; label: string; fits: (p: number) => boolean }[] = [
  { key: "p1", label: "עד €1,000 לשבוע", fits: p => p < 1000 },
  { key: "p2", label: "€1,000–2,000", fits: p => p >= 1000 && p < 2000 },
  { key: "p3", label: "€2,000–3,500", fits: p => p >= 2000 && p < 3500 },
  { key: "p4", label: "מעל €3,500", fits: p => p >= 3500 && p !== Infinity },
];
const BEDS: { key: string; label: string }[] = [
  { key: "studio", label: "סטודיו" }, { key: "1", label: "חדר שינה 1" }, { key: "2", label: "2 חדרי שינה" },
  { key: "3", label: "3 חדרי שינה" }, { key: "4", label: "4+ חדרי שינה" },
];
type Filters = { kind: Filter; sizes: string[]; beds: string[]; prices: string[]; quarters: string[]; residences: string[]; amen: string[] };
const NO_FILTERS: Filters = { kind: "all", sizes: [], beds: [], prices: [], quarters: [], residences: [], amen: [] };
type ListKey = "sizes" | "beds" | "prices" | "quarters" | "residences" | "amen";

/* ── The filters column ────────────────────────────────────── */
function Section({ title, children, open: startOpen = true }: { title: string; children: ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  return (
    <section className="border-b border-line py-4 first:pt-0 last:border-0">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 text-[16px] font-bold text-ink min-h-[36px]">
        {title}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

function Chip({ on, label, count, onClick }: { on: boolean; label: string; count?: number; onClick: () => void }) {
  const off = !on && count === 0;
  return (
    <button type="button" onClick={onClick} aria-pressed={on} disabled={off}
      className={`inline-flex items-center min-h-[38px] ps-3.5 pe-2 rounded-full border text-[14px] font-bold transition-colors disabled:opacity-40 ${
        on ? "bg-ink border-ink text-white" : "bg-white border-line text-ink hover:border-ink"}`}>
      <bdi>{label}</bdi>{count !== undefined && (
        <bdi className={`ms-2 inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 rounded-full text-[12px] font-bold tabular-nums ${
          on ? "bg-white/20 text-white" : "bg-soft text-muted"}`}>{count}</bdi>
      )}
    </button>
  );
}

function CheckRow({ on, label, count, onClick, dir }: { on: boolean; label: string; count: number; onClick: () => void; dir?: "auto" }) {
  return (
    <label className={`flex items-center gap-3 min-h-[38px] cursor-pointer group ${!on && count === 0 ? "opacity-40" : ""}`}>
      <input type="checkbox" checked={on} onChange={onClick} disabled={!on && count === 0}
        className="w-[18px] h-[18px] shrink-0 rounded-[5px] accent-[var(--color-accent,#1f5eff)] cursor-pointer" />
      <span className="flex-1 text-[15px] text-ink group-hover:text-accent transition-colors" dir={dir}>{label}</span>
      <bdi className="text-[13px] text-muted tabular-nums">{count}</bdi>
    </label>
  );
}

type PanelProps = {
  f: Filters; setKind: (k: Filter) => void; toggle: (key: ListKey, v: string) => void; clearAll: () => void;
  kindCounts: Map<string, number>; sizeCounts: Map<string, number>; bedCounts: Map<string, number>; priceCounts: Map<string, number>;
  quarterCounts: Map<string, number>; residenceCounts: Map<string, number>; amenCounts: Map<string, number>; amenOptions: string[];
  activeCount: number; bare?: boolean;
};

function FilterPanel(p: PanelProps) {
  const [q, setQ] = useState("");
  const [allRes, setAllRes] = useState(false);
  const residences = [...p.residenceCounts.keys(), ...p.f.residences.filter(r => !p.residenceCounts.has(r))]
    .sort((a, b) => (p.residenceCounts.get(b) ?? 0) - (p.residenceCounts.get(a) ?? 0) || a.localeCompare(b));
  const found = q ? residences.filter(r => r.toLowerCase().includes(q.toLowerCase())) : residences;
  const list = allRes || q ? found : found.slice(0, 8);
  const quarters = (Object.keys(QUARTER_HE) as (keyof typeof QUARTER_HE)[]).filter(k => p.quarterCounts.has(k) || p.f.quarters.includes(k));
  return (
    <div className={p.bare ? "" : "rounded-card border border-line bg-white p-5"}>
      {!p.bare && (
        <div className="flex items-center justify-between mb-4">
          <span className="font-display font-bold text-[20px] text-ink">סינון</span>
          {p.activeCount > 0 && <button type="button" onClick={p.clearAll} className="text-[14px] font-bold text-accent hover:underline">ניקוי הכל</button>}
        </div>
      )}
      <Section title="סוג הדירה">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(x => <Chip key={x.key} on={p.f.kind === x.key} label={x.label} count={p.kindCounts.get(x.key) ?? 0} onClick={() => p.setKind(x.key)} />)}
        </div>
      </Section>
      <Section title="לכמה אנשים">
        <div className="flex flex-wrap gap-2">
          {SIZES.filter(z => z.key !== "any").map(z => <Chip key={z.key} on={p.f.sizes.includes(z.key)} label={z.label} count={p.sizeCounts.get(z.key) ?? 0} onClick={() => p.toggle("sizes", z.key)} />)}
        </div>
      </Section>
      <Section title="חדרי שינה">
        <div className="flex flex-wrap gap-2">
          {BEDS.map(z => <Chip key={z.key} on={p.f.beds.includes(z.key)} label={z.label} count={p.bedCounts.get(z.key) ?? 0} onClick={() => p.toggle("beds", z.key)} />)}
        </div>
      </Section>
      <Section title="מחיר לשבוע">
        <div className="flex flex-col">
          {PRICES.map(z => <CheckRow key={z.key} on={p.f.prices.includes(z.key)} label={z.label} count={p.priceCounts.get(z.key) ?? 0} onClick={() => p.toggle("prices", z.key)} />)}
        </div>
      </Section>
      {quarters.length > 0 && (
        <Section title="שכונה בכפר">
          <div className="flex flex-col">
            {quarters.map(k => <CheckRow key={k} on={p.f.quarters.includes(k)} label={QUARTER_HE[k]} count={p.quarterCounts.get(k) ?? 0} onClick={() => p.toggle("quarters", k)} />)}
          </div>
        </Section>
      )}
      {residences.length > 0 && (
        <Section title="בניין">
          {residences.length > 8 && (
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש בניין…" dir="auto"
              className="w-full min-h-[42px] mb-2 px-3.5 rounded-xl border border-line text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink" />
          )}
          <div className="flex flex-col">
            {list.map(r => <CheckRow key={r} dir="auto" on={p.f.residences.includes(r)} label={r} count={p.residenceCounts.get(r) ?? 0} onClick={() => p.toggle("residences", r)} />)}
            {!q && found.length > 8 && (
              <button type="button" onClick={() => setAllRes(v => !v)} className="mt-1 self-start text-[14px] font-bold text-accent hover:underline min-h-[36px]">
                {allRes ? "פחות בניינים" : `כל ${found.length} הבניינים`}
              </button>
            )}
            {q && !found.length && <p className="text-[14px] text-muted py-2">לא נמצא בניין בשם הזה</p>}
          </div>
        </Section>
      )}
      {p.amenOptions.length > 0 && (
        <Section title="מה יש בדירה" open={false}>
          <div className="flex flex-col">
            {p.amenOptions.map(m => <CheckRow key={m} on={p.f.amen.includes(m)} label={m} count={p.amenCounts.get(m) ?? 0} onClick={() => p.toggle("amen", m)} />)}
          </div>
        </Section>
      )}
    </div>
  );
}
const selectCls = "min-h-[44px] rounded-full bg-white border border-line-strong px-4 text-[15px] font-bold text-ink hover:border-ink focus:outline-none focus:border-ink cursor-pointer";

const ico = (path: ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const IcoCal = () => ico(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>, 16);
const IcoUsers = () => ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>, 16);
const IcoBed = () => ico(<><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" /><path d="M3 15h18M7 9V6h4v3" /></>, 16);
const IcoSize = () => ico(<><path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6" /></>, 16);
const IcoFilter = () => ico(<><path d="M4 6h16M7 12h10M10 18h4" /></>, 18);
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
        {(() => { const pl = placeOf(apt); return pl.residence || pl.quarter ? (
          <div className="text-[13px] font-bold text-accent tracking-wide" dir="auto">
            {pl.residence}{pl.residence && pl.quarter ? " · " : ""}{pl.quarter ? `רובע ${QUARTER_HE[pl.quarter].split(" (")[0]}` : ""}
          </div>) : null; })()}
        <h3 className="font-display font-bold text-[20px] md:text-[21px] leading-snug text-ink">{aptShortName(apt)}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted">
          {apt.max_guests ? <span className="inline-flex items-center gap-1"><IcoUsers />{apt.max_guests} אנשים</span> : null}
          {(() => { const b = bedroomsOf(apt); return b === "studio" ? <span className="inline-flex items-center gap-1"><IcoBed />סטודיו</span> : b ? <span className="inline-flex items-center gap-1"><IcoBed />{b === 1 ? "חדר שינה" : `${b} חדרי שינה`}</span> : null; })()}
          {apt.sqm ? <span className="inline-flex items-center gap-1"><IcoSize />{apt.sqm} מ&quot;ר</span> : null}
          {isAgency(apt) && aptParts(apt).code ? <span className="text-[13px]">קוד {aptParts(apt).code}</span> : null}
        </div>
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
  const [f,          setF]          = useState<Filters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false); // the filters drawer on phones
  const [sort,       setSort]       = useState<Sort>("rec");
  const [perPage,    setPerPage]    = useState<number>(12);
  const [page,       setPage]       = useState(1);
  const gridTop = useRef<HTMLDivElement>(null);
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
  // people: an apartment too small for the group is left out (the group size comes from the address)
  const fitsGroup = available.filter(a => !params.get("guests") || (a.max_guests ?? 0) >= guests);
  // the price a card shows, as a week, so nightly and weekly apartments sort and filter together
  const priceOf = (a: Apartment) => {
    const w = matchingWeek(a, checkin, checkout);
    if (w) return w.price;
    if (isAgency(a)) return minWeekPrice(a) ?? Infinity;
    const night = fromNights[a.id] ?? a.price_per_night;
    return night ? night * 7 : Infinity;
  };
  const facts = (a: Apartment) => {
    const pl = placeOf(a), b = bedroomsOf(a);
    return { pl, bed: b === "studio" ? "studio" : b >= 4 ? "4" : b ? String(b) : "", price: priceOf(a) };
  };
  // does an apartment pass the filters (all of them, or all but one: that one's own counts)
  const passes = (a: Apartment, skip?: keyof Filters) => {
    const x = facts(a);
    if (skip !== "kind" && f.kind !== "all" && (f.kind === "agency") !== isAgency(a)) return false;
    if (skip !== "sizes" && f.sizes.length && !f.sizes.some(k => (SIZES.find(z => z.key === k) ?? SIZES[0]).fits(a.max_guests ?? 0))) return false;
    if (skip !== "beds" && f.beds.length && !f.beds.includes(x.bed)) return false;
    if (skip !== "prices" && f.prices.length && !f.prices.some(k => (PRICES.find(z => z.key === k) ?? PRICES[0]).fits(x.price))) return false;
    if (skip !== "quarters" && f.quarters.length && !(x.pl.quarter && f.quarters.includes(x.pl.quarter))) return false;
    if (skip !== "residences" && f.residences.length && !(x.pl.residence && f.residences.includes(x.pl.residence))) return false;
    if (skip !== "amen" && f.amen.length && !f.amen.every(m => (a.amenities ?? []).includes(m))) return false;
    return true;
  };
  const filtered = fitsGroup.filter(a => passes(a));
  /** how many apartments each value of a filter would show, given the other filters */
  const countBy = (key: keyof Filters, val: (a: Apartment) => string[] | string | null) => {
    const m = new Map<string, number>();
    for (const a of fitsGroup) if (passes(a, key)) {
      const v = val(a); for (const k of (Array.isArray(v) ? v : v ? [v] : [])) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const kindCounts = countBy("kind", a => ["all", isAgency(a) ? "agency" : "own"]);
  const sizeCounts = countBy("sizes", a => SIZES.filter(z => z.key !== "any" && z.fits(a.max_guests ?? 0)).map(z => z.key));
  const bedCounts = countBy("beds", a => facts(a).bed || null);
  const priceCounts = countBy("prices", a => PRICES.filter(z => z.fits(priceOf(a))).map(z => z.key));
  const quarterCounts = countBy("quarters", a => placeOf(a).quarter);
  const residenceCounts = countBy("residences", a => placeOf(a).residence);
  const amenCounts = countBy("amen", a => a.amenities ?? []);
  const amenOptions = [...new Map([...countBy("amen", a => a.amenities ?? [])]).keys()]
    .filter(m => (amenCounts.get(m) ?? 0) >= 2 || f.amen.includes(m)).sort((x, y) => (amenCounts.get(y) ?? 0) - (amenCounts.get(x) ?? 0)).slice(0, 10);

  const sorted = sort === "rec" ? filtered : [...filtered].sort((a, b) =>
    sort === "low" ? priceOf(a) - priceOf(b)
    : sort === "high" ? (priceOf(b) === Infinity ? -1 : priceOf(a) === Infinity ? 1 : priceOf(b) - priceOf(a))
    : sort === "big" ? (b.max_guests ?? 0) - (a.max_guests ?? 0) || (b.sqm ?? 0) - (a.sqm ?? 0)
    : (a.max_guests ?? 0) - (b.max_guests ?? 0) || (a.sqm ?? 0) - (b.sqm ?? 0));
  const pages = Math.max(1, Math.ceil(sorted.length / perPage));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * perPage, current * perPage);
  const goTo = (n: number) => {
    setPage(n);
    gridTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const pick = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  // one filter changes, the list starts again at page 1
  const toggle = (key: "sizes" | "beds" | "prices" | "quarters" | "residences" | "amen", v: string) => {
    setF(o => ({ ...o, [key]: o[key].includes(v) ? o[key].filter(x => x !== v) : [...o[key], v] }));
    setPage(1);
  };
  const setKind = (k: Filter) => { setF(o => ({ ...o, kind: k })); setPage(1); };
  const clearAll = () => { setF(NO_FILTERS); setPage(1); };
  const active: { label: string; off: () => void }[] = [
    ...(f.kind !== "all" ? [{ label: FILTERS.find(x => x.key === f.kind)!.label, off: () => setKind("all") }] : []),
    ...f.sizes.map(v => ({ label: `${SIZES.find(z => z.key === v)?.label} אנשים`, off: () => toggle("sizes", v) })),
    ...f.beds.map(v => ({ label: BEDS.find(z => z.key === v)?.label ?? v, off: () => toggle("beds", v) })),
    ...f.prices.map(v => ({ label: PRICES.find(z => z.key === v)?.label ?? v, off: () => toggle("prices", v) })),
    ...f.quarters.map(v => ({ label: `רובע ${QUARTER_HE[v as keyof typeof QUARTER_HE]?.split(" (")[0] ?? v}`, off: () => toggle("quarters", v) })),
    ...f.residences.map(v => ({ label: v, off: () => toggle("residences", v) })),
    ...f.amen.map(v => ({ label: v, off: () => toggle("amen", v) })),
  ];
  const panelProps = { f, setKind, toggle, clearAll, kindCounts, sizeCounts, bedCounts, priceCounts, quarterCounts, residenceCounts, amenCounts, amenOptions, activeCount: active.length };

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
                {loading ? "טוענים את הדירות…" : `${filtered.length} ${filtered.length === 1 ? "דירה" : "דירות"}${hasDates ? " פנויות לתאריכים שבחרתם" : ""}. הדירות שלנו, ודירות לשבוע שלם.`}
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
        <div ref={gridTop} className="scroll-mt-24 lg:grid lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-8 xl:gap-10 items-start">
          {/* ── Filters: a column on the right on a computer, a drawer on a phone ── */}
          <aside className="hidden lg:block sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pe-1 -me-1" aria-label="סינון הדירות">
            <FilterPanel {...panelProps} />
          </aside>

          <div className="min-w-0">
            {/* top bar: how many, the filters button on a phone, sort and page size */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowFilters(true)}
                  className="lg:hidden inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-ink text-white text-[15px] font-bold">
                  <IcoFilter /> סינון{active.length ? <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-white text-ink text-[13px] flex items-center justify-center">{active.length}</span> : null}
                </button>
                <p className="text-[16px] text-ink"><b className="font-extrabold">{filtered.length}</b> {filtered.length === 1 ? "דירה" : "דירות"}{hasDates ? " פנויות בתאריכים שלכם" : ""}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-[14px] text-muted">
                  <span className="hidden sm:inline">מיון</span>
                  <select value={sort} onChange={e => pick(setSort)(e.target.value as Sort)} className={selectCls}>
                    {SORTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-[14px] text-muted">
                  <span className="hidden sm:inline">בעמוד</span>
                  <select value={perPage} onChange={e => pick(setPerPage)(Number(e.target.value))} className={selectCls}>
                    {PER_PAGE.map(n => <option key={n} value={n}>{n} דירות</option>)}
                  </select>
                </label>
              </div>
            </div>

            {active.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5" aria-label="הסינון שבחרתם">
                {active.map(a => (
                  <button key={a.label} type="button" onClick={a.off}
                    className="inline-flex items-center gap-1.5 min-h-[36px] ps-3.5 pe-2.5 rounded-full bg-accent-soft text-accent text-[14px] font-bold hover:bg-accent hover:text-white transition-colors" dir="auto">
                    {a.label} <span aria-hidden="true" className="text-[16px] leading-none">×</span><span className="sr-only">הסרה</span>
                  </button>
                ))}
                <button type="button" onClick={clearAll} className="text-[14px] font-bold text-muted underline underline-offset-4 hover:text-ink px-1">ניקוי הכל</button>
              </div>
            )}

            {/* ── Grid ──────────────────────────────────────────── */}
            <h2 className="sr-only">{hasDates ? "הדירות הפנויות לתאריכים שבחרתם" : "כל הדירות בואל טורנס"}</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
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
                title={hasDates ? "אין דירות פנויות לתאריכים ולסינון האלה" : "אין דירות שמתאימות לסינון"}
                text={hasDates ? "נסו תאריכים אחרים, או להסיר חלק מהסינון." : "נסו להסיר חלק מהסינון."}
                action={<>
                  {active.length > 0 && <button type="button" onClick={clearAll} className={btn.outline}>ניקוי הסינון</button>}
                  <button type="button" onClick={() => setShowCal(true)} className={btn.primary}>לבחור תאריכים</button>
                </>}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                {shown.map((apt, i) => (
                  <ApartmentCard key={apt.id} apt={apt} checkin={checkin} checkout={checkout} guests={guests} rules={rulesMap[apt.id] ?? []} fromNightPrice={fromNights[apt.id]} priority={current === 1 && i < 3} />
                ))}
              </div>
            )}
            {pages > 1 && (
              <nav aria-label="עמודים" className="mt-10 flex flex-col items-center gap-3">
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <button type="button" onClick={() => goTo(current - 1)} disabled={current <= 1}
                    className="min-h-[44px] px-4 rounded-full border border-line-strong text-[15px] font-bold text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-line-strong">הקודם</button>
                  {Array.from({ length: pages }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === pages || Math.abs(n - current) <= 1)
                    .map((n, i, arr) => (
                      <span key={n} className="flex items-center gap-1.5">
                        {i > 0 && n - arr[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
                        <button type="button" onClick={() => goTo(n)} aria-current={n === current ? "page" : undefined}
                          className={`min-w-[44px] min-h-[44px] rounded-full border text-[15px] font-bold transition-colors ${
                            n === current ? "bg-ink border-ink text-white" : "bg-white border-line-strong text-ink hover:border-ink"}`}>{n}</button>
                      </span>
                    ))}
                  <button type="button" onClick={() => goTo(current + 1)} disabled={current >= pages}
                    className="min-h-[44px] px-4 rounded-full border border-line-strong text-[15px] font-bold text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-line-strong">הבא</button>
                </div>
                <p className="text-[14px] text-muted">{(current - 1) * perPage + 1}–{Math.min(current * perPage, sorted.length)} מתוך {sorted.length} דירות</p>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* the filters on a phone: a sheet from the bottom */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-[85] bg-ink/45 flex items-end" role="dialog" aria-modal="true" aria-label="סינון הדירות" onClick={() => setShowFilters(false)}>
          <div className="w-full max-h-[88dvh] bg-white rounded-t-[24px] flex flex-col" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
              <span className="font-display font-bold text-[20px] text-ink">סינון</span>
              <button type="button" onClick={() => setShowFilters(false)} aria-label="סגירה" className="w-11 h-11 flex items-center justify-center rounded-full text-muted hover:bg-soft"><IcoClose /></button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1"><FilterPanel {...panelProps} bare /></div>
            <div className="p-4 border-t border-line flex gap-2">
              {active.length > 0 && <button type="button" onClick={clearAll} className={`${btn.outline} flex-1`}>ניקוי</button>}
              <button type="button" onClick={() => setShowFilters(false)} className={`${btn.primary} flex-[2]`}>הצגת {filtered.length} דירות</button>
            </div>
          </div>
        </div>
      )}
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
