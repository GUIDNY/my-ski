"use client";

import { useEffect, useState } from "react";
import type { GuideTable } from "@/lib/guides";
import type { WeekPrices } from "@/lib/week-prices";
import Table from "./guide-table";

const dm = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}`; };
const dmy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}.${y}`; };

function asTable(p: WeekPrices, notes: Record<string, string>): GuideTable {
  return {
    caption: `נכון ל-${dmy(p.asOf)}, מהדירות שעוד פנויות באתר`,
    head: ["שבת כניסה", "החל מ-", "מה קורה"],
    rows: p.weeks.map(([w, price]) => [`[${dm(w)}](/weekly?week=${w})`, `€${price.toLocaleString("en-US")}`, notes[w] ?? ""]),
  };
}

/**
 * The cheapest open apartment of every Saturday: the prices of the page's
 * build (what search engines read), then today's from /api/week-prices.
 */
export default function LiveWeeks({ initial, notes }: { initial: WeekPrices | null; notes: Record<string, string> }) {
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
  if (!prices || prices.weeks.length === 0) return null;
  return <Table table={asTable(prices, notes)} />;
}
