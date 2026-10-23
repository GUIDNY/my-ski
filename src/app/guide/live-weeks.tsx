"use client";

import { useEffect, useState } from "react";
import type { GuideTable } from "@/lib/guides";
import type { WeekPrices } from "@/lib/week-prices";
import Table from "./guide-table";

type TableLang = "he" | "en" | "fr";

const MONTHS_SHORT = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
};
const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
};
const parts = (iso: string) => iso.split("-").map(Number) as [number, number, number];
const plusWeek = (iso: string) => {
  const [y, m, d] = parts(iso);
  const t = new Date(Date.UTC(y, m - 1, d + 7));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
};
const group = (n: number, sep: string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);

/* Every word and number of the table, in the guide's language. English and
   French link a Saturday to that week's apartments (/en/apartments?checkin…),
   Hebrew to the Saturday-to-Saturday page. */
const L: Record<TableLang, {
  day: (iso: string) => string; asOf: (iso: string) => string; eur: (n: number) => string; href: (w: string) => string;
  caption: (asOf: string, count: boolean) => string; head: (count: boolean) => string[]; none: string;
}> = {
  he: {
    day: iso => { const [, m, d] = parts(iso); return `${d}.${m}`; },
    asOf: iso => { const [y, m, d] = parts(iso); return `${d}.${m}.${y}`; },
    eur: n => `€${group(n, ",")}`,
    href: w => `/weekly?week=${w}`,
    caption: (d, count) => count
      ? `נכון ל-${d}: הדירה הזולה בכל שבוע, וכמה דירות עוד פנויות ב[שבת עד שבת](/weekly)`
      : `נכון ל-${d}, מהדירות שעוד פנויות באתר`,
    head: count => count ? ["שבת כניסה", "החל מ-", "פנויות", "מה קורה"] : ["שבת כניסה", "החל מ-", "מה קורה"],
    none: "אין כרגע",
  },
  en: {
    day: iso => { const [, m, d] = parts(iso); return `Sat ${d} ${MONTHS_SHORT.en[m - 1]}`; },
    asOf: iso => { const [y, m, d] = parts(iso); return `${d} ${MONTHS.en[m - 1]} ${y}`; },
    eur: n => `€${group(n, ",")}`,
    href: w => `/en/apartments?checkin=${w}&checkout=${plusWeek(w)}`,
    caption: (d, count) => count
      ? `As of ${d}: the cheapest apartment still free each week (the whole apartment, Saturday to Saturday), and how many are free`
      : `As of ${d}: the cheapest apartment still free each week (the whole apartment, Saturday to Saturday)`,
    head: count => count ? ["Week from", "From", "Free", "What's on"] : ["Week from", "From", "What's on"],
    none: "None now",
  },
  fr: {
    day: iso => { const [, m, d] = parts(iso); return `sam. ${d} ${MONTHS_SHORT.fr[m - 1]}`; },
    asOf: iso => { const [y, m, d] = parts(iso); return `${d === 1 ? "1er" : d} ${MONTHS.fr[m - 1]} ${y}`; },
    eur: n => `${group(n, " ")} €`,
    href: w => `/fr/apartments?checkin=${w}&checkout=${plusWeek(w)}`,
    caption: (d, count) => count
      ? `Au ${d} : l'appartement le moins cher encore libre chaque semaine (l'appartement entier, du samedi au samedi), et combien sont libres`
      : `Au ${d} : l'appartement le moins cher encore libre chaque semaine (l'appartement entier, du samedi au samedi)`,
    head: count => count ? ["Semaine du", "À partir de", "Libres", "À savoir"] : ["Semaine du", "À partir de", "À savoir"],
    none: "Aucun pour l'instant",
  },
};

type Options = { notes: Record<string, string>; only?: string[]; count?: boolean; lang?: TableLang };

function asTable(p: WeekPrices, { notes, only, count, lang = "he" }: Options): GuideTable {
  const t = L[lang];
  const byWeek = new Map(p.weeks.map(w => [w[0], w]));
  // `only`: just those Saturdays, and one that has nothing open still gets its row
  const weeks = only ? only.filter(w => w >= p.asOf) : p.weeks.map(w => w[0]);
  return {
    caption: t.caption(t.asOf(p.asOf), !!count),
    head: t.head(!!count),
    rows: weeks.map(w => {
      const m = byWeek.get(w);
      const cells = [`[${t.day(w)}](${t.href(w)})`, m ? t.eur(m[1]) : t.none];
      if (count) cells.push(m ? String(m[2] ?? "") : "0");
      cells.push(notes[w] ?? "");
      return cells;
    }),
  };
}

/**
 * The cheapest open apartment of every Saturday: the prices of the page's
 * build (what search engines read), then today's from /api/week-prices.
 */
export default function LiveWeeks({ initial, ...options }: Options & { initial: WeekPrices | null }) {
  const [prices, setPrices] = useState(initial);
  useEffect(() => {
    let alive = true;
    fetch("/api/week-prices")
      .then(r => (r.ok ? r.json() : null))
      .then((d: (WeekPrices & { ok?: boolean }) | null) => {
        if (alive && d?.ok && Array.isArray(d.weeks) && typeof d.asOf === "string") setPrices({ asOf: d.asOf, weeks: d.weeks });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!prices) return null;
  const table = asTable(prices, options);
  if (table.rows.length === 0) return null;
  return <Table table={table} />;
}
