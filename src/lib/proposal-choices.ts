import type { ProposalBlock, ProposalData } from "@/types";

/*
 * The choices a customer makes on a quote page (/p/<id>): items taken out, how many people take a
 * per-person item, and ski equipment added. The page sends them to the PDF (?c=...), and the PDF
 * is printed with the quote as they changed it, using the same rules as the page (ProposalView).
 */
export type ProposalChoices = { off: number[]; qty: Record<number, number>; eq: number };

const money = (s: string) => Number(String(s).replace(/[^\d.]/g, "")) || 0;
const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
// the same rule as the website and the bots: 30 a day, at most 120 for 6 days, 20 for each day after
const equipCost = (days: number) => (days <= 0 ? 0 : days <= 6 ? Math.min(30 * days, 120) : 120 + 20 * (days - 6));
type Kind = "equipment" | "transfer" | "skipass" | "flight" | "bag" | null;
const kindOf = (label: string): Kind =>
  /לינה|דירה/.test(label) ? null
    : /ציוד/.test(label) ? "equipment"
    : /הסעה/.test(label) ? "transfer"
    : /סקי פס/.test(label) ? "skipass"
    : /כבודה|מזוודה/.test(label) ? "bag"
    : /טיס/.test(label) ? "flight" : null;

export function encodeChoices(c: ProposalChoices): string {
  const qty = Object.entries(c.qty).map(([i, q]) => `${i}:${q}`).join(".");
  return [c.off.join("."), qty, String(c.eq || 0)].join("~");
}

export function decodeChoices(s: string | null | undefined): ProposalChoices | null {
  if (!s) return null;
  const [off = "", qty = "", eq = "0"] = String(s).slice(0, 300).split("~");
  const n = (x: string) => Math.max(0, Math.min(99, Math.round(Number(x) || 0)));
  const c: ProposalChoices = {
    off: off.split(".").filter(Boolean).map(n),
    qty: Object.fromEntries(qty.split(".").filter(Boolean).map(p => p.split(":")).filter(p => p.length === 2).map(([i, q]) => [n(i), n(q)])),
    eq: n(eq),
  };
  return c.off.length || Object.keys(c.qty).length || c.eq ? c : null;
}

/** The quote with the customer's choices applied (prices recomputed from the quote's own rows). */
export function applyChoices(data: ProposalData, c: ProposalChoices, pageUrl?: string): ProposalData {
  const d: ProposalData = JSON.parse(JSON.stringify(data));
  const blocks = d.sections.flatMap(s => s.blocks);
  const table = blocks.find((b): b is Extract<ProposalBlock, { type: "table" }> => b.type === "table");
  if (!table) return d;
  const allText = JSON.stringify(data.sections) + " " + (data.subtitle || "") + " " + (data.hero?.chips || []).join(" ");
  const guests = data.hero?.guests || Number(allText.match(/(\d+)\s*(?:אנשים|אורחים)/)?.[1]) || 1;
  const nights = Number(allText.match(/(\d+)\s*לילות/)?.[1]) || 7;
  const skiDays = Math.max(nights - 1, 0);
  const four = (table.header?.length ?? 0) >= 4;
  const clampQ = (q: number) => Math.min(Math.max(q, 1), guests);

  let total = money(table.total?.[table.total.length - 1] || "0");
  const rows: string[][] = [];
  table.rows.forEach((r, i) => {
    const kind = kindOf(r[0]);
    const amount = money(r[r.length - 1]);
    const baseQty = Number(String(r[0]).match(/×\s*(\d+)/)?.[1]) || (four ? Number(String(r[1]).match(/^\d+$/)?.[0]) : 0) || 0;
    const perHead = !!kind && baseQty > 0 && (kind !== "transfer" || baseQty > 1);
    if (c.off.includes(i) && kind && kind !== "flight" && kind !== "bag") { total -= amount; return; }
    if (perHead && c.qty[i] != null) {
      const q = clampQ(c.qty[i]);
      const now = (amount / baseQty) * q;
      total += now - amount;
      const row = [...r];
      row[0] = String(row[0]).replace(/×\s*\d+/, `× ${q}`);
      if (four && /^\d+$/.test(String(row[1]))) row[1] = String(q);
      row[row.length - 1] = eur(now);
      rows.push(row);
      return;
    }
    rows.push(r);
  });
  const hasEquip = rows.some(r => kindOf(r[0]) === "equipment");
  if (c.eq > 0 && !hasEquip && skiDays > 0) {
    const q = clampQ(c.eq);
    const unit = equipCost(skiDays);
    total += unit * q;
    rows.push(four ? [`השכרת ציוד סקי/סנובורד, ${skiDays} ימים`, String(q), eur(unit), eur(unit * q)] : [`השכרת ציוד סקי/סנובורד, ${skiDays} ימים × ${q}`, eur(unit * q)]);
  }
  table.rows = rows;
  if (table.total?.length) table.total[table.total.length - 1] = eur(total);

  const kinds = new Set(rows.map(r => kindOf(r[0])).filter(Boolean));
  const eqRow = rows.find(r => kindOf(r[0]) === "equipment");
  for (const s of d.sections) {
    // the payment links were made for the original total: in a changed quote, the page pays the new one
    s.blocks = s.blocks.filter(b => b.type !== "payment");
    for (const b of s.blocks) {
      if (b.type === "summary") {
        const set = (key: string, val: string) => { const r = b.rows.find(x => x[0] === key); if (r) r[1] = val; else b.rows.push([key, val]); };
        set("ציוד סקי/סנובורד", kinds.has("equipment") ? `כלול, ${eqRow ? (four ? eqRow[1] : String(eqRow[0]).match(/×\s*(\d+)/)?.[1] || guests) : guests} סטים` : "לא כלול");
        if (!kinds.has("transfer")) set("הסעה משדה התעופה", "לא כלולה");
        if (!kinds.has("skipass")) set("סקי פס", "לא כלול");
      }
      if (b.type === "note" && /^מחיר לאדם:/.test(b.text)) b.text = `מחיר לאדם: ${eur(total / guests)} (כל ${guests} האורחים באותה חבילה).`;
    }
  }
  const priceSec = d.sections.find(s => s.blocks.includes(table));
  if (priceSec && pageUrl) priceSec.blocks.push({ type: "note", text: `ההצעה עודכנה לפי הבחירה שלכם. לתשלום: ${pageUrl}` });
  d.hero = { ...(d.hero || {}), total: eur(total), perPerson: eur(total / guests), included: undefined, ...(pageUrl ? { payUrl: pageUrl } : {}) };
  return d;
}
