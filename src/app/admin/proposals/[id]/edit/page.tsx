"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import AdminGate from "@/components/AdminGate";
import ProposalDocument, { PROPOSAL_CSS } from "@/components/ProposalDocument";
import { computeTotals, money, type LineItem } from "@/lib/proposal-pricing";
import { calcTotalForRange, type PricingRule } from "@/lib/pricing";
import type { Proposal, ProposalData, ProposalSection, ProposalBlock, ProposalStatus, SkiPass } from "@/types";

const input = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const BLOCK_LABELS: Record<string, string> = { flight: "טיסה", banner: "פס טיסה", kv: "מפתח/ערך", summary: "סיכום", list: "רשימה", text: "פסקה", note: "הערה", option: "תיבה ממוסגרת", table: "טבלת מחירים" };
const emptyBlock = (type: string): ProposalBlock => {
  switch (type) {
    case "banner": return { type: "banner", text: "" };
    case "kv": return { type: "kv", rows: [["", ""]] };
    case "summary": return { type: "summary", rows: [["", ""]] };
    case "list": return { type: "list", items: [""] };
    case "note": return { type: "note", text: "" };
    case "option": return { type: "option", label: "", text: "" };
    case "table": return { type: "table", header: ["פריט", "כמות", "מחיר ליחידה", "סה\"כ"], rows: [], total: [] };
    case "flight": return { type: "flight", direction: "out", date: "", from: "תל אביב (TLV)", to: "", airline: "", depart: "", arrive: "", nonstop: true, price: "" };
    default: return { type: "text", text: "" };
  }
};

// ── table block <-> line items (editor keeps _items/_discount/_vatRate on the block) ──
type TableExtra = { _items?: LineItem[]; _discount?: number; _vatRate?: number };
function tableToItems(b: ProposalBlock & TableExtra): { items: LineItem[]; discount: number; vatRate: number } {
  return { items: b._items ?? [], discount: b._discount ?? 0, vatRate: b._vatRate ?? 0 };
}
function itemsToTable(items: LineItem[], discount: number, vatRate: number, currency: string): ProposalBlock & TableExtra {
  const t = computeTotals(items, discount, vatRate);
  const rows: string[][] = items.map(it => [it.label, String(it.qty), money(it.unitPrice, currency), money(it.qty * it.unitPrice, currency)]);
  if (discount) rows.push(["הנחה", "", "", money(discount, currency)]);
  if (vatRate > 0) rows.push([`מע\"מ ${Math.round(vatRate * 100)}%`, "", "", money(t.vat, currency)]);
  return { type: "table", header: ["פריט", "כמות", "מחיר ליחידה", "סה\"כ"], rows, total: ["סה\"כ לתשלום", "", "", money(t.total, currency)], _items: items, _discount: discount, _vatRate: vatRate };
}

function EditorInner() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Proposal | null>(null);
  const [data, setData] = useState<ProposalData | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [srcUrl, setSrcUrl] = useState("");
  const [skiPasses, setSkiPasses] = useState<SkiPass[]>([]);

  useEffect(() => {
    fetch(`/api/proposals/${id}`).then(r => r.json()).then((row: Proposal) => { setP(row); setData(row.data); });
  }, [id]);

  useEffect(() => {
    fetch("/api/ski-passes").then(r => r.json()).then(setSkiPasses);
  }, []);

  const save = useCallback(async () => {
    if (!p || !data) return;
    setSaving(true);
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_name: p.client_name, client_email: p.client_email, client_phone: p.client_phone, status: p.status, valid_until: p.valid_until || null, currency: p.currency, data }),
    });
    setSaving(false); setSavedAt(new Date().toLocaleTimeString("he-IL"));
  }, [p, data, id]);

  if (!p || !data) return <div className="p-10 text-center text-gray-400" dir="rtl">טוען…</div>;

  const setMeta = (patch: Partial<Proposal>) => setP({ ...p, ...patch });
  const setD = (patch: Partial<ProposalData>) => setData({ ...data, ...patch });
  const setSection = (si: number, sec: ProposalSection) => setD({ sections: data.sections.map((s, i) => i === si ? sec : s) });
  const move = <T,>(arr: T[], i: number, dir: number): T[] => { const j = i + dir; if (j < 0 || j >= arr.length) return arr; const c = [...arr]; [c[i], c[j]] = [c[j], c[i]]; return c; };

  const fmtHe = (d?: string) => d ? new Date(d).toLocaleDateString("he-IL") : "";

  // paste an apartment URL (/apartments/<id>?checkin&checkout&guests),
  // a quote URL (/q/slug/id), OR a quote/order code → auto-fill everything
  const prefillFromSource = async () => {
    const raw = srcUrl.trim();
    if (!raw) { alert("הדבק/י קישור או קוד"); return; }

    let segs: string[] = [];
    let qp = new URLSearchParams();
    try { const u = new URL(raw); segs = u.pathname.split("/").filter(Boolean); qp = u.searchParams; }
    catch { const [path, query] = raw.split("?"); segs = path.split("/").filter(Boolean); if (query) qp = new URLSearchParams(query); }
    const token = segs[segs.length - 1] || raw;

    // 0) apartment page URL with dates → compute price from pricing rules
    const aptIdx = segs.indexOf("apartments");
    if (aptIdx >= 0 && segs[aptIdx + 1]) {
      await buildFromApartment(segs[aptIdx + 1], qp.get("checkin"), qp.get("checkout"), qp.get("guests"));
      return;
    }
    // 1) saved quote (rich: apartment + flights)
    const qr = await fetch(`/api/quotes/${encodeURIComponent(token)}`);
    if (qr.ok) { await buildFromQuote(await qr.json()); return; }
    // 2) order code
    const or = await fetch(`/api/orders/code/${encodeURIComponent(token.toLowerCase())}`);
    if (or.ok) {
      const o = await or.json();
      const summary: ProposalSection = { heading: "סיכום החופשה", blocks: [{ type: "summary", rows: [
        ["יעד", o.area || "ואל טורנס, צרפת"], ["דירה", o.apartment_name || ""],
        ["תאריכים", `${fmtHe(o.checkin)} – ${fmtHe(o.checkout)}`], ["לילות", String(o.nights ?? "")], ["אורחים", String(o.guests ?? "")],
      ] as [string, string][] }] };
      const price: ProposalSection = { heading: "פירוט מחירים", blocks: [itemsToTable([{ label: `${o.apartment_name || "חבילת נופש"} · ${o.nights ?? ""} לילות`, qty: 1, unitPrice: Number(o.total_eur) || 0 }], 0, 0, p.currency)] };
      const terms = data.sections.filter(s => s.heading === "תנאים");
      const nonTerms = data.sections.filter(s => s.heading !== "תנאים");
      setP({ ...p, client_name: o.customer_name || p.client_name });
      setData({ ...data, subtitle: o.area || data.subtitle, sections: [...nonTerms, summary, price, ...terms] });
      return;
    }
    alert("לא נמצאה הצעה/הזמנה עבור הקישור הזה");
  };

  const HEBREW_LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י"];

  // Paste an apartment link and add it as one more UNIT of the same combined
  // group booking (e.g. a group of 12 split across 3 apartments) — photos +
  // its own price folded straight into the shared price table's running
  // total, repeated once per link. NOT "pick one of these" alternatives —
  // every apartment added here is booked together, so the total must
  // reflect all of them, not just show each one's price informationally.
  const addApartmentOption = async () => {
    const raw = srcUrl.trim();
    if (!raw) { alert("הדבק/י קישור לדירה"); return; }
    let segs: string[] = [];
    let qp = new URLSearchParams();
    try { const u = new URL(raw); segs = u.pathname.split("/").filter(Boolean); qp = u.searchParams; }
    catch { const [path, query] = raw.split("?"); segs = path.split("/").filter(Boolean); if (query) qp = new URLSearchParams(query); }
    const aptIdx = segs.indexOf("apartments");
    const aptId = aptIdx >= 0 ? segs[aptIdx + 1] : null;
    if (!aptId) { alert("זה לא נראה כמו קישור לדירה (/apartments/...)"); return; }

    const checkin = qp.get("checkin");
    const checkout = qp.get("checkout");

    const [aptRes, rulesRes] = await Promise.all([
      fetch(`/api/apartments/${aptId}`),
      fetch(`/api/pricing-rules?apartment_id=${aptId}`),
    ]);
    if (!aptRes.ok) { alert("הדירה לא נמצאה"); return; }
    const apt = await aptRes.json();
    const rules: PricingRule[] = rulesRes.ok ? await rulesRes.json() : [];

    const nights = checkin && checkout ? Math.max(0, Math.round((+new Date(checkout) - +new Date(checkin)) / 86400000)) : 0;
    const total = nights > 0 ? calcTotalForRange(checkin!, checkout!, Number(apt.price_per_night) || 0, rules) : Number(apt.price_per_night) || 0;

    const existingUnits = data.sections.filter(s => s.heading.startsWith("דירה ")).length;
    const letter = HEBREW_LETTERS[existingUnits] ?? String(existingUnits + 1);

    const blocks: ProposalBlock[] = [];
    if (Array.isArray(apt.images) && apt.images.length) blocks.push({ type: "gallery", urls: apt.images.slice(0, 6) });
    blocks.push({ type: "kv", rows: [
      [nights > 0 ? `מחיר ל-${nights} לילות` : "מחיר ללילה", `€${Math.round(total).toLocaleString("en-US")}`],
      ["חדרים", String(apt.beds ?? "-")],
      ["גודל", apt.sqm ? `${apt.sqm} מ"ר` : "-"],
      ["אורחים", String(apt.max_guests ?? "-")],
    ] });
    const firstSentence = firstTwoSentences(apt.description || "");
    if (firstSentence) blocks.push({ type: "text", text: firstSentence });

    const section: ProposalSection = { heading: `דירה ${letter} — ${apt.name}`, blocks };
    const terms = data.sections.filter(s => s.heading === "תנאים");
    const nonTerms = data.sections.filter(s => s.heading !== "תנאים");
    const sections = [...nonTerms, section, ...terms];

    // Fold this apartment's price into the shared price table in the SAME
    // update as adding its section — two separate setD calls here would
    // both read the same pre-update `data` closure and the second would
    // silently discard the first (classic React stale-closure race).
    const priceIdx = sections.findIndex(s => s.heading === "פירוט מחירים");
    const priceLabel = `דירה ${letter} — ${apt.name}${nights > 0 ? ` · ${nights} לילות` : ""}`;
    if (priceIdx < 0) {
      sections.push({ heading: "פירוט מחירים", blocks: [itemsToTable([{ label: priceLabel, qty: 1, unitPrice: total }], 0, 0, p.currency)] });
    } else {
      const sec = sections[priceIdx];
      const tbIdx = sec.blocks.findIndex(b => b.type === "table");
      const tb = (tbIdx >= 0 ? sec.blocks[tbIdx] : itemsToTable([], 0, 0, p.currency)) as ProposalBlock & TableExtra;
      const { items, discount, vatRate } = tableToItems(tb);
      const nb = itemsToTable([...items, { label: priceLabel, qty: 1, unitPrice: total }], discount, vatRate, p.currency);
      sections[priceIdx] = { ...sec, blocks: tbIdx >= 0 ? sec.blocks.map((b, i) => i === tbIdx ? nb : b) : [...sec.blocks, nb] };
    }

    setD({ sections });
    setSrcUrl("");
  };

  const buildFromApartment = async (aptId: string, checkin: string | null, checkout: string | null, guests: string | null) => {
    const [aptRes, rulesRes] = await Promise.all([
      fetch(`/api/apartments/${aptId}`),
      fetch(`/api/pricing-rules?apartment_id=${aptId}`),
    ]);
    if (!aptRes.ok) { alert("הדירה לא נמצאה"); return; }
    const apt = await aptRes.json();
    const rules: PricingRule[] = rulesRes.ok ? await rulesRes.json() : [];
    const nights = checkin && checkout ? Math.max(0, Math.round((+new Date(checkout) - +new Date(checkin)) / 86400000)) : 0;
    const total = checkin && checkout ? calcTotalForRange(checkin, checkout, Number(apt.price_per_night) || 0, rules) : 0;
    await buildFromQuote({
      apartment_id: aptId, apartment_name: apt.name,
      checkin: checkin ?? undefined, checkout: checkout ?? undefined,
      nights, guests: guests ? +guests : undefined, grand_total: total,
    });
  };

  const firstTwoSentences = (t: string) =>
    t.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2).join(" ");

  const buildFromQuote = async (q: {
    apartment_id?: string; apartment_name?: string; checkin?: string; checkout?: string;
    nights?: number; guests?: number; transfer?: boolean; equipment?: boolean; ski_pass?: boolean;
    apt_total?: number; grand_total?: number;
  }) => {
    let desc = "";
    let images: string[] = [];
    if (q.apartment_id) {
      const ar = await fetch(`/api/apartments/${q.apartment_id}`);
      if (ar.ok) { const a = await ar.json(); desc = a.description || ""; images = Array.isArray(a.images) ? a.images : []; }
    }
    const aptTotal = Number(q.apt_total ?? q.grand_total) || 0;
    const grand = Number(q.grand_total ?? q.apt_total) || 0;
    const addonDiff = Math.max(0, grand - aptTotal);

    const included: ProposalSection = { heading: "החבילה כוללת", blocks: [{ type: "list", items: [
      "טיסות הלוך וחזור.",
      ...(q.transfer ? ["הסעה משדה התעופה לוואל טורנס וחזרה."] : []),
      `${q.nights ?? ""} לילות לינה ב${q.apartment_name || "ואל טורנס"}.`,
      ...(q.equipment ? ["השכרת ציוד סקי/סנובורד."] : []),
      ...(q.ski_pass ? ["סקי פס."] : []),
    ] }] };

    // lodging: real photos right in the proposal, plus the first two sentences.
    // Only fall back to a link when the apartment has no photos to embed.
    const lodgingBlocks: ProposalBlock[] = [];
    if (images.length) lodgingBlocks.push({ type: "gallery", urls: images.slice(0, 6) });
    const first2 = firstTwoSentences(desc);
    if (first2) lodgingBlocks.push({ type: "text", text: first2 });
    if (!images.length && srcUrl.trim()) lodgingBlocks.push({ type: "note", text: `תמונות ותיאור מלא של הדירה זמינים בקישור: ${srcUrl.trim()}` });
    const lodging: ProposalSection = { heading: "הלינה", blocks: lodgingBlocks };

    const summary: ProposalSection = { heading: "סיכום החופשה", blocks: [{ type: "summary", rows: [
      ["יעד", "ואל טורנס, צרפת"], ["דירה", q.apartment_name || ""],
      ["תאריכים", `${fmtHe(q.checkin)} – ${fmtHe(q.checkout)}`], ["לילות", String(q.nights ?? "")], ["אורחים", String(q.guests ?? "")],
    ] as [string, string][] }] };

    // price: lodging line + transfer/equipment as separate lines when present
    const items: LineItem[] = [{ label: `${q.apartment_name || "לינה"} · ${q.nights ?? ""} לילות`, qty: 1, unitPrice: aptTotal }];
    if (q.transfer) items.push({ label: "הסעות שדה תעופה הלוך-חזור", qty: 1, unitPrice: addonDiff || 180 });
    if (q.equipment) items.push({ label: "השכרת ציוד סקי/סנובורד", qty: 1, unitPrice: 0 });
    const price: ProposalSection = { heading: "פירוט מחירים", blocks: [itemsToTable(items, 0, 0, p.currency)] };

    const terms = data.sections.filter(s => s.heading === "תנאים");
    const nonTerms = data.sections.filter(s => s.heading !== "תנאים");
    setData({
      ...data,
      subtitle: `ואל טורנס, צרפת  |  ${fmtHe(q.checkin)} – ${fmtHe(q.checkout)}`,
      intro: data.intro || `מוצעת בזאת חופשת סקי בוואל טורנס, צרפת, בתאריכים ${fmtHe(q.checkin)} עד ${fmtHe(q.checkout)}, למשך ${q.nights ?? ""} לילות.`,
      sections: [...nonTerms, included, lodging, summary, price, ...terms].filter(s => s.blocks.length > 0),
    });
  };

  // add-on quick actions — structured flight blocks (easy form)
  const addFlightSection = () => {
    const terms = data.sections.filter(s => s.heading === "תנאים");
    const nonTerms = data.sections.filter(s => s.heading !== "תנאים");
    const flights: ProposalSection = { heading: "טיסות", blocks: [
      { type: "flight", direction: "out", date: "", from: "תל אביב (TLV)", to: "", airline: "", depart: "", arrive: "", nonstop: true, price: "" },
      { type: "flight", direction: "return", date: "", from: "", to: "תל אביב (TLV)", airline: "", depart: "", arrive: "", nonstop: true, price: "" },
    ] };
    setD({ sections: [...nonTerms, flights, ...terms] });
  };

  const addPriceLine = (label: string, unitPrice: number) => {
    const sections = [...data.sections];
    let idx = sections.findIndex(s => s.heading === "פירוט מחירים");
    if (idx < 0) { sections.push({ heading: "פירוט מחירים", blocks: [itemsToTable([], 0, 0, p.currency)] }); idx = sections.length - 1; }
    const sec = sections[idx];
    const tbIdx = sec.blocks.findIndex(b => b.type === "table");
    const tb = (tbIdx >= 0 ? sec.blocks[tbIdx] : itemsToTable([], 0, 0, p.currency)) as ProposalBlock & TableExtra;
    const { items, discount, vatRate } = tableToItems(tb);
    const nb = itemsToTable([...items, { label, qty: 1, unitPrice }], discount, vatRate, p.currency);
    sections[idx] = { ...sec, blocks: tbIdx >= 0 ? sec.blocks.map((b, i) => i === tbIdx ? nb : b) : [...sec.blocks, nb] };
    setD({ sections });
  };

  const addPriceNote = (text: string) => {
    const sections = [...data.sections];
    let idx = sections.findIndex(s => s.heading === "פירוט מחירים");
    if (idx < 0) { sections.push({ heading: "פירוט מחירים", blocks: [itemsToTable([], 0, 0, p.currency)] }); idx = sections.length - 1; }
    const sec = sections[idx];
    if (sec.blocks.some(b => b.type === "note" && b.text === text)) return;
    sections[idx] = { ...sec, blocks: [...sec.blocks, { type: "note", text }] };
    setD({ sections });
  };

  const addSkiPass = () => {
    const passes = skiPasses.filter(sp => sp.area === "val_thorens" && sp.type === "adult");
    const pass = passes.find(sp => sp.duration_days === 6) ?? passes[0];
    if (!pass) return;
    addPriceLine(`סקי פס — ואל טורנס, ${pass.duration_days} ימים`, pass.price);
    addPriceNote("שדרוג לסקי פס שלושת העמקים (Les 3 Vallées) עולה כ-€50 יותר לנוסע — לבירור לפני ההזמנה.");
  };

  const addSection = () => setD({ sections: [...data.sections, { heading: "סעיף חדש", blocks: [] }] });
  const addBlock = (si: number, type: string) => { const s = data.sections[si]; setSection(si, { ...s, blocks: [...s.blocks, emptyBlock(type)] }); };

  return (
    <div dir="rtl" className="lg:flex lg:gap-6 lg:items-start">
      {/* ── form ── */}
      <div className="lg:w-1/2 lg:max-h-[calc(100vh-40px)] lg:overflow-y-auto lg:pl-2 space-y-4">
        <div className="flex items-center justify-between gap-2 sticky top-0 bg-gray-50 py-2 z-10">
          <a href="/admin/proposals" className="text-sm text-gray-500 hover:text-gray-800">→ כל ההצעות</a>
          <div className="flex items-center gap-2">
            {savedAt && <span className="text-xs text-emerald-600">נשמר {savedAt}</span>}
            <button onClick={() => setShowPreview(v => !v)} className="lg:hidden text-xs font-bold text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5">{showPreview ? "טופס" : "תצוגה"}</button>
            <a href={`/admin/proposals/${id}/print`} target="_blank" className="text-xs font-bold text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5">PDF ↗</a>
            <button onClick={save} disabled={saving} className="bg-blue-600 disabled:opacity-60 text-white text-xs font-bold px-4 py-1.5 rounded-lg">{saving ? "שומר…" : "שמירה"}</button>
          </div>
        </div>

        <div className={showPreview ? "hidden lg:block space-y-4" : "space-y-4"}>
          {/* client + meta */}
          <Card title="פרטי ההצעה והלקוח">
            <div className="text-xs text-gray-400 mb-2 font-mono">{p.proposal_number}</div>
            {/* pull an existing quote/order to auto-fill dates, flights & apartment */}
            <div className="flex gap-1.5 mb-3 bg-blue-50/60 rounded-xl p-2">
              <input className={input} dir="ltr" placeholder="קישור דירה (/apartments/…?checkin&checkout) · הצעה (/q/…) · או קוד"
                value={srcUrl} onChange={e => setSrcUrl(e.target.value)} />
              <button onClick={prefillFromSource} className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 rounded-lg">משוך ומלא ↺</button>
              <button onClick={addApartmentOption} title="מוסיף את הדירה כאפשרות נוספת (עם תמונות) בלי למחוק את שאר ההצעה — להשוואה בין כמה דירות"
                className="whitespace-nowrap border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 font-bold text-xs px-4 rounded-lg">+ הוסף כאפשרות</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="שם הלקוח" value={p.client_name} onChange={e => setMeta({ client_name: e.target.value })} />
              <input className={input} placeholder="טלפון" value={p.client_phone} onChange={e => setMeta({ client_phone: e.target.value })} />
              <input className={input} placeholder="אימייל" dir="ltr" value={p.client_email} onChange={e => setMeta({ client_email: e.target.value })} />
              <select className={input} value={p.status} onChange={e => setMeta({ status: e.target.value as ProposalStatus })}>
                <option value="draft">טיוטה</option><option value="sent">נשלחה</option><option value="accepted">אושרה</option><option value="expired">פג תוקף</option>
              </select>
              <label className="text-xs text-gray-500">בתוקף עד<input type="date" className={input} value={p.valid_until ?? ""} onChange={e => setMeta({ valid_until: e.target.value })} /></label>
              <label className="text-xs text-gray-500">מטבע<select className={input} value={p.currency} onChange={e => setMeta({ currency: e.target.value })}><option value="EUR">EUR €</option><option value="ILS">ILS ₪</option><option value="USD">USD $</option></select></label>
            </div>
          </Card>

          {/* document header */}
          <Card title="כותרת המסמך">
            <input className={input + " mb-2"} placeholder="כותרת ראשית" value={data.title} onChange={e => setD({ title: e.target.value })} />
            <input className={input + " mb-2"} placeholder="תת-כותרת" value={data.subtitle} onChange={e => setD({ subtitle: e.target.value })} />
            <textarea className={input} rows={3} placeholder="פסקת פתיחה" value={data.intro} onChange={e => setD({ intro: e.target.value })} />
          </Card>

          {/* sections */}
          {data.sections.map((sec, si) => (
            <Card key={si} title={`סעיף ${si + 1}`}
              right={<div className="flex gap-1">
                <IcoBtn onClick={() => setD({ sections: move(data.sections, si, -1) })}>↑</IcoBtn>
                <IcoBtn onClick={() => setD({ sections: move(data.sections, si, 1) })}>↓</IcoBtn>
                <IcoBtn onClick={() => setD({ sections: data.sections.filter((_, i) => i !== si) })} danger>✕</IcoBtn>
              </div>}>
              <input className={input + " mb-2 font-bold"} placeholder="כותרת הסעיף" value={sec.heading} onChange={e => setSection(si, { ...sec, heading: e.target.value })} />
              <div className="space-y-2">
                {sec.blocks.map((b, bi) => (
                  <BlockEditor key={bi} block={b} currency={p.currency}
                    onChange={nb => setSection(si, { ...sec, blocks: sec.blocks.map((x, i) => i === bi ? nb : x) })}
                    onMove={dir => setSection(si, { ...sec, blocks: move(sec.blocks, bi, dir) })}
                    onDelete={() => setSection(si, { ...sec, blocks: sec.blocks.filter((_, i) => i !== bi) })} />
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.keys(BLOCK_LABELS).map(t => (
                  <button key={t} onClick={() => addBlock(si, t)} className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md px-2 py-1">+ {BLOCK_LABELS[t]}</button>
                ))}
              </div>
            </Card>
          ))}

          <div className="flex flex-wrap gap-2">
            <button onClick={addSection} className="bg-gray-900 text-white font-bold text-sm px-4 py-2 rounded-xl">+ סעיף</button>
            <button onClick={addFlightSection} className="border border-blue-200 text-blue-700 bg-blue-50 font-semibold text-xs px-3 py-2 rounded-xl">✈️ הוסף טיסה</button>
            <button onClick={() => addPriceLine("הסעות שדה תעופה הלוך-חזור", 180)} className="border border-gray-200 text-gray-700 font-semibold text-xs px-3 py-2 rounded-xl">🚐 הוסף הסעה</button>
            <button onClick={() => addPriceLine("השכרת ציוד סקי/סנובורד", 120)} className="border border-gray-200 text-gray-700 font-semibold text-xs px-3 py-2 rounded-xl">🎿 הוסף ציוד</button>
            <button onClick={addSkiPass} disabled={!skiPasses.length} className="border border-gray-200 text-gray-700 font-semibold text-xs px-3 py-2 rounded-xl disabled:opacity-50">⛷️ הוסף סקי פס</button>
          </div>

          {/* signature */}
          <Card title="בלוק חתימה">
            <input className={input + " mb-2"} placeholder="כותרת" value={data.signature?.heading ?? ""} onChange={e => setD({ signature: { ...(data.signature ?? { text: "", fields: [] }), heading: e.target.value } })} />
            <textarea className={input + " mb-2"} rows={2} placeholder="טקסט הצהרה" value={data.signature?.text ?? ""} onChange={e => setD({ signature: { ...(data.signature ?? { heading: "", fields: [] }), text: e.target.value } })} />
            <input className={input} placeholder="שדות (מופרד בפסיק)" value={(data.signature?.fields ?? []).join(", ")} onChange={e => setD({ signature: { ...(data.signature ?? { heading: "", text: "" }), fields: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } })} />
          </Card>
        </div>
      </div>

      {/* ── live preview ── */}
      <div className={`lg:w-1/2 lg:sticky lg:top-2 ${showPreview ? "" : "hidden lg:block"}`}>
        <style dangerouslySetInnerHTML={{ __html: PROPOSAL_CSS }} />
        <div className="rounded-xl overflow-auto bg-[#e9edf1] max-h-[calc(100vh-40px)]" style={{ zoom: 0.62 } as React.CSSProperties}>
          <ProposalDocument data={data} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-gray-800 text-sm">{title}</h3>{right}</div>
      {children}
    </div>
  );
}
function IcoBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`w-7 h-7 rounded-lg border text-sm ${danger ? "border-red-200 text-red-500 hover:bg-red-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{children}</button>;
}

// ── per-block editor ──
function BlockEditor({ block, currency, onChange, onMove, onDelete }: {
  block: ProposalBlock; currency: string; onChange: (b: ProposalBlock) => void; onMove: (dir: number) => void; onDelete: () => void;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-2.5 bg-gray-50/40">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-gray-400">{BLOCK_LABELS[block.type]}</span>
        <div className="flex gap-1">
          <IcoBtn onClick={() => onMove(-1)}>↑</IcoBtn><IcoBtn onClick={() => onMove(1)}>↓</IcoBtn><IcoBtn onClick={onDelete} danger>✕</IcoBtn>
        </div>
      </div>
      {block.type === "banner" && (
        <input className={input} value={block.text} onChange={e => onChange({ ...block, text: e.target.value })} placeholder="לדוגמה: טיסת הלוך — 6.3.2027 · תל אביב (TLV) ← ליון (LYS)" />
      )}
      {(block.type === "text" || block.type === "note") && (
        <textarea className={input} rows={2} value={block.text} onChange={e => onChange({ ...block, text: e.target.value })} placeholder="טקסט" />
      )}
      {block.type === "option" && (<>
        <input className={input + " mb-1"} placeholder="כותרת" value={block.label} onChange={e => onChange({ ...block, label: e.target.value })} />
        <textarea className={input} rows={2} placeholder="טקסט" value={block.text} onChange={e => onChange({ ...block, text: e.target.value })} />
      </>)}
      {block.type === "list" && (
        <textarea className={input} rows={4} placeholder="פריט בכל שורה" value={block.items.join("\n")} onChange={e => onChange({ ...block, items: e.target.value.split("\n") })} />
      )}
      {(block.type === "kv" || block.type === "summary") && (
        <div className="space-y-1">
          {block.rows.map((r, i) => (
            <div key={i} className="flex gap-1 items-center">
              <input className={input + " flex-1"} placeholder="תווית" value={r[0]}
                onChange={e => onChange({ ...block, rows: block.rows.map((x, j) => j === i ? [e.target.value, x[1]] : x) as [string, string][] })} />
              <span className="text-gray-300 text-xs">:</span>
              <input className={input + " flex-1"} placeholder="ערך" value={r[1]}
                onChange={e => onChange({ ...block, rows: block.rows.map((x, j) => j === i ? [x[0], e.target.value] : x) as [string, string][] })} />
              <button onClick={() => onChange({ ...block, rows: block.rows.filter((_, j) => j !== i) as [string, string][] })} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
            </div>
          ))}
          <button onClick={() => onChange({ ...block, rows: [...block.rows, ["", ""]] as [string, string][] })} className="text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md px-2 py-1">+ שורה</button>
        </div>
      )}
      {block.type === "flight" && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            <select className={input + " flex-1"} value={block.direction} onChange={e => onChange({ ...block, direction: e.target.value as "out" | "return" })}>
              <option value="out">הלוך</option><option value="return">חזור</option>
            </select>
            <input className={input + " flex-1"} placeholder="תאריך (6.3.2027)" value={block.date} onChange={e => onChange({ ...block, date: e.target.value })} />
          </div>
          <div className="flex gap-1">
            <input className={input + " flex-1"} placeholder="מוצא" value={block.from} onChange={e => onChange({ ...block, from: e.target.value })} />
            <span className="text-gray-300 self-center">←</span>
            <input className={input + " flex-1"} placeholder="יעד" value={block.to} onChange={e => onChange({ ...block, to: e.target.value })} />
          </div>
          <input className={input} placeholder="חברת תעופה" value={block.airline} onChange={e => onChange({ ...block, airline: e.target.value })} />
          <div className="flex gap-1">
            <input className={input + " flex-1"} placeholder="שעת המראה" value={block.depart} onChange={e => onChange({ ...block, depart: e.target.value })} />
            <input className={input + " flex-1"} placeholder="שעת נחיתה" value={block.arrive} onChange={e => onChange({ ...block, arrive: e.target.value })} />
          </div>
          <div className="flex gap-2 items-center">
            <input className={input + " flex-1"} placeholder="מחיר (למשל €320)" value={block.price} onChange={e => onChange({ ...block, price: e.target.value })} />
            <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap"><input type="checkbox" checked={block.nonstop} onChange={e => onChange({ ...block, nonstop: e.target.checked })} className="w-4 h-4 accent-blue-600" /> טיסה ישירה</label>
          </div>
        </div>
      )}
      {block.type === "table" && <TableEditor block={block} currency={currency} onChange={onChange} />}
    </div>
  );
}

function TableEditor({ block, currency, onChange }: { block: ProposalBlock; currency: string; onChange: (b: ProposalBlock) => void }) {
  const { items, discount, vatRate } = tableToItems(block as ProposalBlock & TableExtra);
  const apply = (nItems: LineItem[], nDiscount: number, nVat: number) => onChange(itemsToTable(nItems, nDiscount, nVat, currency));
  const t = computeTotals(items, discount, vatRate);
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex gap-1">
          <input className={input + " flex-[3]"} placeholder="פריט" value={it.label} onChange={e => apply(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x), discount, vatRate)} />
          <input className={input + " flex-1"} type="number" placeholder="כמות" value={it.qty || ""} onChange={e => apply(items.map((x, j) => j === i ? { ...x, qty: +e.target.value } : x), discount, vatRate)} />
          <input className={input + " flex-1"} type="number" placeholder="מחיר" value={it.unitPrice || ""} onChange={e => apply(items.map((x, j) => j === i ? { ...x, unitPrice: +e.target.value } : x), discount, vatRate)} />
          <button onClick={() => apply(items.filter((_, j) => j !== i), discount, vatRate)} className="text-red-400 text-xs px-1">✕</button>
        </div>
      ))}
      <button onClick={() => apply([...items, { label: "", qty: 1, unitPrice: 0 }], discount, vatRate)} className="text-[11px] font-semibold text-blue-600 bg-blue-50 rounded-md px-2 py-1">+ שורה</button>
      <div className="flex gap-1 pt-1">
        <label className="flex-1 text-[11px] text-gray-500">הנחה (שלילי)<input className={input} type="number" value={discount || ""} onChange={e => apply(items, +e.target.value, vatRate)} /></label>
        <label className="flex-1 text-[11px] text-gray-500">מע״מ %<input className={input} type="number" value={vatRate ? Math.round(vatRate * 100) : ""} onChange={e => apply(items, discount, (+e.target.value || 0) / 100)} /></label>
      </div>
      <div className="text-xs text-gray-600 pt-1">סה״כ ביניים {money(t.subtotal, currency)}{discount ? ` · הנחה ${money(discount, currency)}` : ""}{vatRate > 0 ? ` · מע״מ ${money(t.vat, currency)}` : ""} · <b>סה״כ {money(t.total, currency)}</b></div>
    </div>
  );
}

export default function ProposalEditPage() {
  return <AdminGate><EditorInner /></AdminGate>;
}
