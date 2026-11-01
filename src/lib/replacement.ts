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
  data.sections = ((data.sections || [])
    // the whole price-breakdown section goes
    .filter(sec => !/פירוט מחירים|מחיר|תשלום/.test(String(sec.heading || "")))
    .map(sec => ({
      ...sec,
      blocks: (sec.blocks || []).filter(b => {
        if (b.type === "payment") return false;
        if (b.type === "table" && PRICEY.test(JSON.stringify(b))) return false;
        if (b.type === "note" && PRICEY.test(String((b as { text?: string }).text || ""))) return false;
        return true;
      }).map(b => {
        if (b.type === "summary" || b.type === "kv") {
          const rows = ((b as { rows?: string[][] }).rows || []).filter(r => !PRICEY.test(r.join(" ")));
          return { ...b, rows };
        }
        return b;
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
