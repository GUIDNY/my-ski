"use client";
import { useState, type ReactNode } from "react";
import { QUARTER_HE } from "@/lib/residences";

/*
 * The filters column of /weekly (שבת עד שבת): bedrooms, how many people the
 * apartment is for, price per person, size, neighbourhood, building and what
 * is in the apartment. Every option shows how many apartments it would leave,
 * given the other filters (the same way /apartments does).
 */

export type WFilters = { beds: string[]; sizes: string[]; prices: string[]; sqm: string[]; quarters: string[]; residences: string[]; amen: string[] };
export type WKey = keyof WFilters;
export const NO_WFILTERS: WFilters = { beds: [], sizes: [], prices: [], sqm: [], quarters: [], residences: [], amen: [] };

export const W_BEDS = [
  { key: "studio", label: "סטודיו" }, { key: "1", label: "חדר שינה 1" }, { key: "2", label: "2 חדרי שינה" },
  { key: "3", label: "3 חדרי שינה" }, { key: "4", label: "4+ חדרי שינה" },
];
export const W_SIZES: { key: string; label: string; fits: (n: number) => boolean }[] = [
  { key: "2", label: "עד 2", fits: n => n <= 2 }, { key: "4", label: "3–4", fits: n => n >= 3 && n <= 4 },
  { key: "6", label: "5–6", fits: n => n >= 5 && n <= 6 }, { key: "8", label: "7–8", fits: n => n >= 7 && n <= 8 },
  { key: "9", label: "9 ומעלה", fits: n => n >= 9 },
];
export const W_PRICES: { key: string; label: string; fits: (p: number) => boolean }[] = [
  { key: "p1", label: "עד €500 לאדם", fits: p => p < 500 }, { key: "p2", label: "€500–800 לאדם", fits: p => p >= 500 && p < 800 },
  { key: "p3", label: "€800–1,100 לאדם", fits: p => p >= 800 && p < 1100 }, { key: "p4", label: "€1,100–1,500 לאדם", fits: p => p >= 1100 && p < 1500 },
  { key: "p5", label: "מעל €1,500 לאדם", fits: p => p >= 1500 },
];
export const W_SQM: { key: string; label: string; fits: (m: number) => boolean }[] = [
  { key: "s1", label: "עד 30 מ\"ר", fits: m => m > 0 && m < 30 }, { key: "s2", label: "30–45 מ\"ר", fits: m => m >= 30 && m < 45 },
  { key: "s3", label: "45–60 מ\"ר", fits: m => m >= 45 && m < 60 }, { key: "s4", label: "60 מ\"ר ומעלה", fits: m => m >= 60 },
];

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
      <bdi>{label}</bdi>
      <bdi className={`ms-2 inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 rounded-full text-[12px] font-bold tabular-nums ${
        on ? "bg-white/20 text-white" : "bg-soft text-muted"}`}>{count}</bdi>
    </button>
  );
}

function CheckRow({ on, label, count, onClick, dir }: { on: boolean; label: string; count: number; onClick: () => void; dir?: "auto" }) {
  return (
    <label className={`flex items-center gap-3 min-h-[38px] cursor-pointer group ${!on && count === 0 ? "opacity-40" : ""}`}>
      <input type="checkbox" checked={on} onChange={onClick} disabled={!on && count === 0}
        className="w-[18px] h-[18px] shrink-0 rounded-[5px] accent-[var(--color-accent,#1f5eff)] cursor-pointer" />
      <span className="flex-1 text-[15px] text-ink group-hover:text-accent transition-colors" dir={dir}>{label}</span>
      <bdi className="inline-flex items-center justify-center min-w-[26px] h-[22px] px-1.5 rounded-full bg-soft text-[12px] font-bold text-muted tabular-nums">{count}</bdi>
    </label>
  );
}

export type WCounts = Record<WKey, Map<string, number>>;

export default function WeeklyFilters({ f, counts, toggle, clearAll, active, amenOptions, bare }: {
  f: WFilters; counts: WCounts; toggle: (k: WKey, v: string) => void; clearAll: () => void; active: number; amenOptions: string[]; bare?: boolean;
}) {
  const [q, setQ] = useState("");
  const [allRes, setAllRes] = useState(false);
  const residences = [...counts.residences.keys(), ...f.residences.filter(r => !counts.residences.has(r))]
    .sort((a, b) => (counts.residences.get(b) ?? 0) - (counts.residences.get(a) ?? 0) || a.localeCompare(b));
  const found = q ? residences.filter(r => r.toLowerCase().includes(q.toLowerCase())) : residences;
  const list = allRes || q ? found : found.slice(0, 8);
  const quarters = (Object.keys(QUARTER_HE) as (keyof typeof QUARTER_HE)[]).filter(k => counts.quarters.has(k) || f.quarters.includes(k));
  const n = (k: WKey, v: string) => counts[k].get(v) ?? 0;
  return (
    <div className={bare ? "" : "rounded-card border border-line bg-white p-5"}>
      {!bare && (
        <div className="flex items-center justify-between mb-4">
          <span className="font-display font-bold text-[20px] text-ink">סינון</span>
          {active > 0 && <button type="button" onClick={clearAll} className="text-[14px] font-bold text-accent hover:underline">ניקוי הכל</button>}
        </div>
      )}
      <Section title="חדרי שינה">
        <div className="flex flex-wrap gap-2">
          {W_BEDS.map(z => <Chip key={z.key} on={f.beds.includes(z.key)} label={z.label} count={n("beds", z.key)} onClick={() => toggle("beds", z.key)} />)}
        </div>
      </Section>
      <Section title="הדירה מתאימה ל">
        <div className="flex flex-wrap gap-2">
          {W_SIZES.map(z => <Chip key={z.key} on={f.sizes.includes(z.key)} label={`${z.label} אנשים`} count={n("sizes", z.key)} onClick={() => toggle("sizes", z.key)} />)}
        </div>
      </Section>
      <Section title="מחיר לאדם">
        <div className="flex flex-col">
          {W_PRICES.map(z => <CheckRow key={z.key} on={f.prices.includes(z.key)} label={z.label} count={n("prices", z.key)} onClick={() => toggle("prices", z.key)} />)}
        </div>
      </Section>
      <Section title="גודל הדירה">
        <div className="flex flex-wrap gap-2">
          {W_SQM.map(z => <Chip key={z.key} on={f.sqm.includes(z.key)} label={z.label} count={n("sqm", z.key)} onClick={() => toggle("sqm", z.key)} />)}
        </div>
      </Section>
      {quarters.length > 0 && (
        <Section title="שכונה בכפר">
          <div className="flex flex-col">
            {quarters.map(k => <CheckRow key={k} on={f.quarters.includes(k)} label={QUARTER_HE[k]} count={n("quarters", k)} onClick={() => toggle("quarters", k)} />)}
          </div>
        </Section>
      )}
      {residences.length > 0 && (
        <Section title="בניין" open={false}>
          {residences.length > 8 && (
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש בניין…" dir="auto"
              className="w-full min-h-[42px] mb-2 px-3.5 rounded-xl border border-line text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-ink" />
          )}
          <div className="flex flex-col">
            {list.map(r => <CheckRow key={r} dir="auto" on={f.residences.includes(r)} label={r} count={n("residences", r)} onClick={() => toggle("residences", r)} />)}
            {!q && found.length > 8 && (
              <button type="button" onClick={() => setAllRes(v => !v)} className="mt-1 self-start text-[14px] font-bold text-accent hover:underline min-h-[36px]">
                {allRes ? "פחות בניינים" : `כל ${found.length} הבניינים`}
              </button>
            )}
          </div>
        </Section>
      )}
      {amenOptions.length > 0 && (
        <Section title="מה יש בדירה" open={false}>
          <div className="flex flex-col">
            {amenOptions.map(m => <CheckRow key={m} on={f.amen.includes(m)} label={m} count={n("amen", m)} onClick={() => toggle("amen", m)} />)}
          </div>
        </Section>
      )}
    </div>
  );
}
