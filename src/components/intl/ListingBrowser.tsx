"use client";
import { useRef, useState, type ReactNode } from "react";
import { EmptyState, btn } from "@/components/ui";
import type { CardData } from "@/lib/intl/cards";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import ApartmentCard from "./ApartmentCard";
import { QUARTER_NAME } from "./quarters";

/*
 * The listing's filters, sort and pages, like an agency site: a column of
 * filters (type, guests, bedrooms, price, quarter, building, amenities) with
 * live counts, the active filters as chips, sort and page size, and a drawer
 * on phones. Works on the cards the search already picked and priced.
 */

type Kind = "all" | "own" | "agency";
type Sort = "rec" | "low" | "high" | "big" | "small";
type ListKey = "sizes" | "beds" | "prices" | "quarters" | "residences" | "amen";
type Filters = { kind: Kind } & Record<ListKey, string[]>;
const NO_FILTERS: Filters = { kind: "all", sizes: [], beds: [], prices: [], quarters: [], residences: [], amen: [] };
const PER_PAGE = [12, 24, 48] as const;
const QUARTERS = ["Caron", "Péclet", "Arolles", "Slalom", "Balcons", "Soleil"];

const SIZES: { key: string; fits: (n: number) => boolean }[] = [
  { key: "2", fits: n => n <= 2 }, { key: "4", fits: n => n >= 3 && n <= 4 }, { key: "6", fits: n => n >= 5 && n <= 6 },
  { key: "8", fits: n => n >= 7 && n <= 8 }, { key: "9", fits: n => n >= 9 },
];
const PRICES: { key: string; fits: (p: number) => boolean }[] = [
  { key: "p1", fits: p => p < 1000 }, { key: "p2", fits: p => p >= 1000 && p < 2000 },
  { key: "p3", fits: p => p >= 2000 && p < 3500 }, { key: "p4", fits: p => p >= 3500 && p !== Infinity },
];
const BEDS = ["studio", "1", "2", "3", "4"];

const L = {
  en: {
    filters: "Filters", clear: "Clear all", clearShort: "Clear", type: "Type of apartment", guests: "Number of guests",
    bedrooms: "Bedrooms", price: "Price per week", quarter: "Area of the village", building: "Building", amen: "Amenities",
    size: { "2": "Up to 2", "4": "3–4", "6": "5–6", "8": "7–8", "9": "9+" } as Record<string, string>,
    sizeChip: (s: string) => `${s} guests`,
    bed: { studio: "Studio", "1": "1 bedroom", "2": "2 bedrooms", "3": "3 bedrooms", "4": "4+ bedrooms" } as Record<string, string>,
    priceL: { p1: "Under €1,000 / week", p2: "€1,000–2,000", p3: "€2,000–3,500", p4: "Over €3,500" } as Record<string, string>,
    searchBuilding: "Find a building…", allBuildings: (n: number) => `All ${n} buildings`, fewer: "Fewer buildings", noBuilding: "No building by that name",
    sort: "Sort", perPage: "Per page", perPageN: (n: number) => `${n} apartments`,
    sorts: { rec: "Recommended", low: "Price: low to high", high: "Price: high to low", big: "Largest first", small: "Smallest first" } as Record<Sort, string>,
    count: (n: number) => n === 1 ? "apartment" : "apartments",
    chosen: "Your filters", remove: "Remove", prev: "Previous", next: "Next", pages: "Pages",
    range: (a: number, b: number, n: number) => `${a}–${b} of ${n} apartments`,
    show: (n: number) => `Show ${n} apartments`, close: "Close",
    emptyTitle: "No apartments match these filters", emptyText: "Try removing some of the filters.",
  },
  fr: {
    filters: "Filtres", clear: "Tout effacer", clearShort: "Effacer", type: "Type d'appartement", guests: "Nombre de personnes",
    bedrooms: "Chambres", price: "Prix par semaine", quarter: "Quartier", building: "Résidence", amen: "Équipements",
    size: { "2": "Jusqu'à 2", "4": "3–4", "6": "5–6", "8": "7–8", "9": "9 et +" } as Record<string, string>,
    sizeChip: (s: string) => `${s} pers.`,
    bed: { studio: "Studio", "1": "1 chambre", "2": "2 chambres", "3": "3 chambres", "4": "4 chambres et +" } as Record<string, string>,
    priceL: { p1: "Moins de 1 000 € / sem.", p2: "1 000 – 2 000 €", p3: "2 000 – 3 500 €", p4: "Plus de 3 500 €" } as Record<string, string>,
    searchBuilding: "Chercher une résidence…", allBuildings: (n: number) => `Les ${n} résidences`, fewer: "Moins de résidences", noBuilding: "Aucune résidence à ce nom",
    sort: "Trier", perPage: "Par page", perPageN: (n: number) => `${n} appartements`,
    sorts: { rec: "Recommandés", low: "Prix croissant", high: "Prix décroissant", big: "Les plus grands", small: "Les plus petits" } as Record<Sort, string>,
    count: (n: number) => n === 1 ? "appartement" : "appartements",
    chosen: "Vos filtres", remove: "Retirer", prev: "Précédent", next: "Suivant", pages: "Pages",
    range: (a: number, b: number, n: number) => `${a}–${b} sur ${n} appartements`,
    show: (n: number) => `Voir ${n} appartements`, close: "Fermer",
    emptyTitle: "Aucun appartement ne correspond à ces filtres", emptyText: "Essayez de retirer quelques filtres.",
  },
};

const ico = (d: ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IcoFilter = () => ico(<path d="M4 6h16M7 12h10M10 18h4" />);
const IcoClose = () => ico(<path d="M6 6l12 12M18 6L6 18" />, 20);

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

function Chip({ on, label, count, onClick }: { on: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} disabled={!on && count === 0}
      className={`inline-flex items-center min-h-[38px] ps-3.5 pe-2 rounded-full border text-[14px] font-bold transition-colors disabled:opacity-40 ${
        on ? "bg-ink border-ink text-white" : "bg-white border-line text-ink hover:border-ink"}`}>
      {label}
      <span className={`ms-2 inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 rounded-full text-[12px] font-bold tabular-nums ${
        on ? "bg-white/20 text-white" : "bg-soft text-muted"}`}>{count}</span>
    </button>
  );
}

function CheckRow({ on, label, count, onClick }: { on: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <label className={`flex items-center gap-3 min-h-[38px] cursor-pointer group ${!on && count === 0 ? "opacity-40" : ""}`}>
      <input type="checkbox" checked={on} onChange={onClick} disabled={!on && count === 0}
        className="w-[18px] h-[18px] shrink-0 rounded-[5px] accent-[var(--color-accent,#1f5eff)] cursor-pointer" />
      <span className="flex-1 text-[15px] text-ink group-hover:text-accent transition-colors">{label}</span>
      <span className="inline-flex items-center justify-center min-w-[26px] h-[22px] px-1.5 rounded-full bg-soft text-[12px] font-bold text-muted tabular-nums">{count}</span>
    </label>
  );
}

const selectCls = "min-h-[44px] rounded-full bg-white border border-line-strong px-4 text-[15px] font-bold text-ink hover:border-ink focus:outline-none focus:border-ink cursor-pointer";
const cnt = (m: Map<string, number>, k: string) => m.get(k) ?? 0;

export default function ListingBrowser({ lang, cards }: { lang: Lang; cards: CardData[] }) {
  const t = L[lang];
  const kinds = DICT[lang].list.filters;
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<Sort>("rec");
  const [perPage, setPerPage] = useState<number>(12);
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");
  const [allRes, setAllRes] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const passes = (c: CardData, skip?: keyof Filters) => {
    const x = c.facts;
    if (skip !== "kind" && f.kind !== "all" && c.kind !== f.kind) return false;
    if (skip !== "sizes" && f.sizes.length && !f.sizes.some(k => SIZES.find(z => z.key === k)?.fits(c.guests ?? 0))) return false;
    if (skip !== "beds" && f.beds.length && !f.beds.includes(x.bed)) return false;
    if (skip !== "prices" && f.prices.length && !f.prices.some(k => PRICES.find(z => z.key === k)?.fits(c.week))) return false;
    if (skip !== "quarters" && f.quarters.length && !(x.quarter && f.quarters.includes(x.quarter))) return false;
    if (skip !== "residences" && f.residences.length && !(x.residence && f.residences.includes(x.residence))) return false;
    if (skip !== "amen" && f.amen.length && !f.amen.every(m => x.amen.includes(m))) return false;
    return true;
  };
  const countBy = (key: keyof Filters, val: (c: CardData) => string[] | string | null) => {
    const m = new Map<string, number>();
    for (const c of cards) if (passes(c, key)) {
      const v = val(c);
      for (const k of Array.isArray(v) ? v : v ? [v] : []) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const kindC = countBy("kind", c => ["all", c.kind]);
  const sizeC = countBy("sizes", c => SIZES.filter(z => z.fits(c.guests ?? 0)).map(z => z.key));
  const bedC = countBy("beds", c => c.facts.bed || null);
  const priceC = countBy("prices", c => PRICES.filter(z => z.fits(c.week)).map(z => z.key));
  const quarterC = countBy("quarters", c => c.facts.quarter);
  const resC = countBy("residences", c => c.facts.residence);
  const amenC = countBy("amen", c => c.facts.amen);
  const amenOptions = [...amenC.keys()].filter(m => cnt(amenC, m) >= 2 || f.amen.includes(m))
    .sort((a, b) => cnt(amenC, b) - cnt(amenC, a)).slice(0, 10);
  const bothKinds = cards.some(c => c.kind === "own") && cards.some(c => c.kind === "agency");

  const filtered = cards.filter(c => passes(c));
  const size = (c: CardData) => (c.guests ?? 0) * 1000 + (c.facts.sqm ?? 0);
  const sorted = sort === "rec" ? filtered : [...filtered].sort((a, b) =>
    sort === "low" ? a.week - b.week
    : sort === "high" ? (b.week === Infinity ? -1 : a.week === Infinity ? 1 : b.week - a.week)
    : sort === "big" ? size(b) - size(a) : size(a) - size(b));
  const pages = Math.max(1, Math.ceil(sorted.length / perPage));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * perPage, current * perPage);
  const goTo = (n: number) => { setPage(n); top.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  const toggle = (key: ListKey, v: string) => {
    setF(o => ({ ...o, [key]: o[key].includes(v) ? o[key].filter(x => x !== v) : [...o[key], v] }));
    setPage(1);
  };
  const setKind = (k: Kind) => { setF(o => ({ ...o, kind: k })); setPage(1); };
  const clearAll = () => { setF(NO_FILTERS); setPage(1); };
  const qn = QUARTER_NAME[lang];
  const active: { key: string; label: string; off: () => void }[] = [
    ...(f.kind !== "all" ? [{ key: "kind", label: kinds[f.kind], off: () => setKind("all") }] : []),
    ...f.sizes.map(v => ({ key: `s${v}`, label: t.sizeChip(t.size[v]), off: () => toggle("sizes", v) })),
    ...f.beds.map(v => ({ key: `b${v}`, label: t.bed[v], off: () => toggle("beds", v) })),
    ...f.prices.map(v => ({ key: v, label: t.priceL[v], off: () => toggle("prices", v) })),
    ...f.quarters.map(v => ({ key: `q${v}`, label: qn[v]?.short ?? v, off: () => toggle("quarters", v) })),
    ...f.residences.map(v => ({ key: `r${v}`, label: v, off: () => toggle("residences", v) })),
    ...f.amen.map(v => ({ key: `a${v}`, label: v, off: () => toggle("amen", v) })),
  ];

  const residences = [...resC.keys(), ...f.residences.filter(r => !resC.has(r))]
    .sort((a, b) => cnt(resC, b) - cnt(resC, a) || a.localeCompare(b));
  const found = q ? residences.filter(r => r.toLowerCase().includes(q.toLowerCase())) : residences;
  const resList = allRes || q ? found : found.slice(0, 8);
  const quarters = QUARTERS.filter(k => quarterC.has(k) || f.quarters.includes(k));

  const panel = (bare: boolean) => (
    <div className={bare ? "" : "rounded-card border border-line bg-white p-5"}>
      {!bare && (
        <div className="flex items-center justify-between mb-4">
          <span className="font-display font-bold text-[20px] text-ink">{t.filters}</span>
          {active.length > 0 && <button type="button" onClick={clearAll} className="text-[14px] font-bold text-accent hover:underline">{t.clear}</button>}
        </div>
      )}
      {bothKinds && (
        <Section title={t.type}>
          <div className="flex flex-wrap gap-2">
            {(["all", "own", "agency"] as const).map(k => <Chip key={k} on={f.kind === k} label={kinds[k]} count={cnt(kindC, k)} onClick={() => setKind(k)} />)}
          </div>
        </Section>
      )}
      <Section title={t.guests}>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(z => <Chip key={z.key} on={f.sizes.includes(z.key)} label={t.size[z.key]} count={cnt(sizeC, z.key)} onClick={() => toggle("sizes", z.key)} />)}
        </div>
      </Section>
      <Section title={t.bedrooms}>
        <div className="flex flex-wrap gap-2">
          {BEDS.map(k => <Chip key={k} on={f.beds.includes(k)} label={t.bed[k]} count={cnt(bedC, k)} onClick={() => toggle("beds", k)} />)}
        </div>
      </Section>
      <Section title={t.price}>
        <div className="flex flex-col">
          {PRICES.map(z => <CheckRow key={z.key} on={f.prices.includes(z.key)} label={t.priceL[z.key]} count={cnt(priceC, z.key)} onClick={() => toggle("prices", z.key)} />)}
        </div>
      </Section>
      {quarters.length > 0 && (
        <Section title={t.quarter}>
          <div className="flex flex-col">
            {quarters.map(k => <CheckRow key={k} on={f.quarters.includes(k)} label={qn[k]?.long ?? k} count={cnt(quarterC, k)} onClick={() => toggle("quarters", k)} />)}
          </div>
        </Section>
      )}
      {residences.length > 0 && (
        <Section title={t.building}>
          {residences.length > 8 && (
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t.searchBuilding}
              className="w-full min-h-[42px] mb-2 px-3.5 rounded-xl border border-line text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink" />
          )}
          <div className="flex flex-col">
            {resList.map(r => <CheckRow key={r} on={f.residences.includes(r)} label={r} count={cnt(resC, r)} onClick={() => toggle("residences", r)} />)}
            {!q && found.length > 8 && (
              <button type="button" onClick={() => setAllRes(v => !v)} className="mt-1 self-start text-[14px] font-bold text-accent hover:underline min-h-[36px]">
                {allRes ? t.fewer : t.allBuildings(found.length)}
              </button>
            )}
            {q && !found.length && <p className="text-[14px] text-muted py-2">{t.noBuilding}</p>}
          </div>
        </Section>
      )}
      {amenOptions.length > 0 && (
        <Section title={t.amen} open={false}>
          <div className="flex flex-col">
            {amenOptions.map(m => <CheckRow key={m} on={f.amen.includes(m)} label={m} count={cnt(amenC, m)} onClick={() => toggle("amen", m)} />)}
          </div>
        </Section>
      )}
    </div>
  );

  const pageBtn = "min-h-[44px] px-4 rounded-full border border-line-strong text-[15px] font-bold text-ink hover:border-ink disabled:opacity-40 disabled:hover:border-line-strong";

  return (
    <div ref={top} className="scroll-mt-24 lg:grid lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-8 xl:gap-10 items-start">
      <aside className="hidden lg:block sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pe-1 -me-1" aria-label={t.filters}>
        {panel(false)}
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDrawer(true)}
              className="lg:hidden inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-ink text-white text-[15px] font-bold">
              <IcoFilter /> {t.filters}
              {active.length ? <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-white text-ink text-[13px] flex items-center justify-center">{active.length}</span> : null}
            </button>
            <p className="text-[16px] text-ink"><b className="font-extrabold">{filtered.length}</b> {t.count(filtered.length)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[14px] text-muted">
              <span className="hidden sm:inline">{t.sort}</span>
              <select value={sort} onChange={e => { setSort(e.target.value as Sort); setPage(1); }} className={selectCls}>
                {(Object.keys(t.sorts) as Sort[]).map(k => <option key={k} value={k}>{t.sorts[k]}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[14px] text-muted">
              <span className="hidden sm:inline">{t.perPage}</span>
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className={selectCls}>
                {PER_PAGE.map(n => <option key={n} value={n}>{t.perPageN(n)}</option>)}
              </select>
            </label>
          </div>
        </div>

        {active.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5" aria-label={t.chosen}>
            {active.map(a => (
              <button key={a.key} type="button" onClick={a.off}
                className="inline-flex items-center gap-1.5 min-h-[36px] ps-3.5 pe-2.5 rounded-full bg-accent-soft text-accent text-[14px] font-bold hover:bg-accent hover:text-white transition-colors">
                {a.label} <span aria-hidden="true" className="text-[16px] leading-none">×</span><span className="sr-only">{t.remove}</span>
              </button>
            ))}
            <button type="button" onClick={clearAll} className="text-[14px] font-bold text-muted underline underline-offset-4 hover:text-ink px-1">{t.clear}</button>
          </div>
        )}

        {shown.length === 0 ? (
          <EmptyState title={t.emptyTitle} text={t.emptyText}
            action={<button type="button" onClick={clearAll} className={btn.outline}>{t.clear}</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
            {shown.map((c, i) => <ApartmentCard key={c.id} c={c} lang={lang} cta={DICT[lang].common.viewApt} eager={current === 1 && i < 3} heading="h3" />)}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label={t.pages} className="mt-10 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button type="button" onClick={() => goTo(current - 1)} disabled={current <= 1} className={pageBtn}>{t.prev}</button>
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
              <button type="button" onClick={() => goTo(current + 1)} disabled={current >= pages} className={pageBtn}>{t.next}</button>
            </div>
            <p className="text-[14px] text-muted">{t.range((current - 1) * perPage + 1, Math.min(current * perPage, sorted.length), sorted.length)}</p>
          </nav>
        )}
      </div>

      {drawer && (
        <div className="lg:hidden fixed inset-0 z-[85] bg-ink/45 flex items-end" role="dialog" aria-modal="true" aria-label={t.filters} onClick={() => setDrawer(false)}>
          <div className="w-full max-h-[88dvh] bg-white rounded-t-[24px] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
              <span className="font-display font-bold text-[20px] text-ink">{t.filters}</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label={t.close} className="w-11 h-11 flex items-center justify-center rounded-full text-muted hover:bg-soft"><IcoClose /></button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1">{panel(true)}</div>
            <div className="p-4 border-t border-line flex gap-2">
              {active.length > 0 && <button type="button" onClick={clearAll} className={`${btn.outline} flex-1`}>{t.clearShort}</button>}
              <button type="button" onClick={() => setDrawer(false)} className={`${btn.primary} flex-[2]`}>{t.show(filtered.length)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
