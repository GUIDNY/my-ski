"use client";

import { useEffect, useState } from "react";
import type { GuideTable } from "@/lib/guides";
import type { WeekPrices } from "@/lib/week-prices";
import Table from "./guide-table";

const dm = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}`; };
const dmy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}.${y}`; };

type Options = { notes: Record<string, string>; only?: string[]; count?: boolean };

function asTable(p: WeekPrices, { notes, only, count }: Options): GuideTable {
  const byWeek = new Map(p.weeks.map(w => [w[0], w]));
  // `only`: just those Saturdays, and one that has nothing open still gets its row
  const weeks = only ? only.filter(w => w >= p.asOf) : p.weeks.map(w => w[0]);
  return {
    caption: count
      ? `נכון ל-${dmy(p.asOf)}: הדירה הזולה בכל שבוע, וכמה דירות עוד פנויות ב[שבת עד שבת](/weekly)`
      : `נכון ל-${dmy(p.asOf)}, מהדירות שעוד פנויות באתר`,
    head: count ? ["שבת כניסה", "החל מ-", "פנויות", "מה קורה"] : ["שבת כניסה", "החל מ-", "מה קורה"],
    rows: weeks.map(w => {
      const m = byWeek.get(w);
      const cells = [`[${dm(w)}](/weekly?week=${w})`, m ? `€${m[1].toLocaleString("en-US")}` : "אין כרגע"];
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
