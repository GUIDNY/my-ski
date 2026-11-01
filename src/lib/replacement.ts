import type { ProposalData } from "@/types";

/*
 * חופשת החזר: the same proposal with every price and payment removed, plus a
 * note that this vacation replaces one cancelled in 2026. The copy is saved
 * as a NEW proposal, so the original quote stays untouched.
 */
export function stripForReplacement(src: ProposalData): ProposalData {
  const data = JSON.parse(JSON.stringify(src)) as ProposalData & { replacement2026?: boolean; hero?: { perPerson?: string; total?: string }; upgrades?: unknown };
  data.replacement2026 = true;
  if (data.hero) { delete data.hero.perPerson; delete data.hero.total; }
  delete (data as { upgrades?: unknown }).upgrades;
  const PRICEY = /€|יורו|₪|מחיר|לתשלום|תשלום|עלות/;
  const noPrice = (t: string) => String(t || "").replace(/[-–·,]?\s*(?:€|EUR)\s*[\d,.]+|[\d,.]+\s*(?:€|יורו|₪|ש"ח)/g, "").replace(/\s{2,}/g, " ").trim();
  data.sections = ((data.sections || [])
    .map(sec => ({
      ...sec,
      // the price table keeps its ITEMS (לינה, סקי פס, הסעות, ציוד, טיסות) — just without prices
      heading: /פירוט מחירים/.test(String(sec.heading || "")) ? "מה כלול בחופשה" : sec.heading,
      blocks: (sec.blocks || []).flatMap(b => {
        if (b.type === "payment") return [];
        if (b.type === "table") {
          const items = ((b as { rows?: string[][] }).rows || []).map(r => noPrice(r[0])).filter(Boolean);
          return items.length ? [{ type: "list", items } as never] : [];
        }
        if (b.type === "note" && PRICEY.test(String((b as { text?: string }).text || ""))) return [];
        if (b.type === "summary" || b.type === "kv") {
          const rows = ((b as { rows?: string[][] }).rows || []).map(r => r.map(noPrice)).filter(r => r[1] !== "" && !PRICEY.test(r.join(" ")));
          return [{ ...b, rows } as never];
        }
        return [b];
      }),
    }))
    .filter(sec => (sec.blocks || []).length > 0)) as ProposalData["sections"];
  // the replacement note, right at the top
  data.sections.unshift({
    heading: "חופשת החזר",
    blocks: [{ type: "note", text: "חופשה זו היא חלופה לחופשה שבוטלה ב-2026. כל פרטי החופשה מופיעים בעמוד זה, ללא מחירים וללא תשלום." } as never],
  });
  return data;
}
