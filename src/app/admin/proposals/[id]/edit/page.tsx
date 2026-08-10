"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import AdminGate from "@/components/AdminGate";
import ProposalDocument, { PROPOSAL_CSS } from "@/components/ProposalDocument";
import { SAVED_BLOCKS } from "@/lib/proposal-demo";
import { computeTotals, money, type LineItem } from "@/lib/proposal-pricing";
import type { Proposal, ProposalData, ProposalSection, ProposalBlock, ProposalStatus } from "@/types";

const input = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const BLOCK_LABELS: Record<string, string> = { banner: "פס טיסה", kv: "מפתח/ערך", summary: "סיכום", list: "רשימה", text: "פסקה", note: "הערה", option: "תיבה ממוסגרת", table: "טבלת מחירים" };
const emptyBlock = (type: string): ProposalBlock => {
  switch (type) {
    case "banner": return { type: "banner", text: "" };
    case "kv": return { type: "kv", rows: [["", ""]] };
    case "summary": return { type: "summary", rows: [["", ""]] };
    case "list": return { type: "list", items: [""] };
    case "note": return { type: "note", text: "" };
    case "option": return { type: "option", label: "", text: "" };
    case "table": return { type: "table", header: ["פריט", "כמות", "מחיר ליחידה", "סה\"כ"], rows: [], total: [] };
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

  useEffect(() => {
    fetch(`/api/proposals/${id}`).then(r => r.json()).then((row: Proposal) => { setP(row); setData(row.data); });
  }, [id]);

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

  // paste a quote URL (/q/slug/id) OR a quote/order code → auto-fill everything
  const prefillFromSource = async () => {
    const raw = srcUrl.trim();
    if (!raw) { alert("הדבק/י קישור להצעה או קוד"); return; }
    // token = last path segment (strip query/hash), or the raw code
    let token = raw;
    try { const u = new URL(raw); token = u.pathname.split("/").filter(Boolean).pop() || raw; }
    catch { token = raw.split(/[?#]/)[0].split("/").filter(Boolean).pop() || raw; }

    // 1) try a saved quote (rich: apartment + flights)
    const qr = await fetch(`/api/quotes/${encodeURIComponent(token)}`);
    if (qr.ok) { await buildFromQuote(await qr.json()); return; }
    // 2) fall back to an order code
    const or = await fetch(`/api/orders/code/${encodeURIComponent(token.toLowerCase())}`);
    if (or.ok) {
      const o = await or.json();
      const summary: ProposalSection = { heading: "סיכום החופשה", blocks: [{ type: "summary", rows: [
        ["יעד", o.area || "ואל טורנס, צרפת"], ["דירה", o.apartment_name || ""],
        ["תאריכים", `${fmtHe(o.checkin)} – ${fmtHe(o.checkout)}`], ["לילות", String(o.nights ?? "")], ["אורחים", String(o.guests ?? "")],
      ] as [string, string][] }] };
      const price: ProposalSection = { heading: "פירוט מחירים", blocks: [itemsToTable([{ label: `${o.apartment_name || "חבילת נופש"} · ${o.nights ?? ""} לילות`, qty: 1, unitPrice: Number(o.total_eur) || 0 }], 0, 0, p.currency)] };
      setP({ ...p, client_name: o.customer_name || p.client_name });
      setData({ ...data, subtitle: o.area || data.subtitle, sections: [...data.sections, summary, price] });
      return;
    }
    alert("לא נמצאה הצעה/הזמנה עבור הקישור הזה");
  };

  const buildFromQuote = async (q: {
    apartment_id?: string; apartment_name?: string; checkin?: string; checkout?: string;
    nights?: number; guests?: number; transfer?: boolean; ski_pass?: boolean; grand_total?: number;
  }) => {
    let desc = "";
    if (q.apartment_id) {
      const ar = await fetch(`/api/apartments/${q.apartment_id}`);
      if (ar.ok) { const a = await ar.json(); desc = a.description || ""; }
    }
    const flights: ProposalSection = { heading: "טיסות", blocks: [
      { type: "banner", text: `טיסת הלוך — ${fmtHe(q.checkin)}  ·  תל אביב (TLV) ← ליון (LYS)` },
      { type: "kv", rows: [["חברת תעופה", ""], ["שעת המראה", ""], ["שעת נחיתה", ""], ["סוג טיסה", "ישירה"]] },
      { type: "banner", text: `טיסת חזור — ${fmtHe(q.checkout)}  ·  ליון (LYS) ← תל אביב (TLV)` },
      { type: "kv", rows: [["חברת תעופה", ""], ["שעת המראה", ""], ["שעת נחיתה", ""], ["סוג טיסה", "ישירה"]] },
    ] };
    const included: ProposalSection = { heading: "החבילה כוללת", blocks: [{ type: "list", items: [
      "טיסות הלוך וחזור.",
      ...(q.transfer ? ["הסעה משדה התעופה בליון לוואל טורנס וחזרה."] : []),
      `${q.nights ?? ""} לילות לינה ב${q.apartment_name || "ואל טורנס"}.`,
      ...(q.ski_pass ? ["סקי פס."] : []),
    ] }] };
    const lodging: ProposalSection = { heading: "הלינה", blocks: desc ? [{ type: "text", text: desc }] : [] };
    const summary: ProposalSection = { heading: "סיכום החופשה", blocks: [{ type: "summary", rows: [
      ["יעד", "ואל טורנס, צרפת"], ["דירה", q.apartment_name || ""],
      ["תאריכים", `${fmtHe(q.checkin)} – ${fmtHe(q.checkout)}`], ["לילות", String(q.nights ?? "")], ["אורחים", String(q.guests ?? "")],
    ] as [string, string][] }] };
    const price: ProposalSection = { heading: "פירוט מחירים", blocks: [itemsToTable([{ label: `${q.apartment_name || "חבילת נופש"} · ${q.nights ?? ""} לילות`, qty: 1, unitPrice: Number(q.grand_total) || 0 }], 0, 0, p.currency)] };
    setData({
      ...data,
      subtitle: `ואל טורנס, צרפת  |  ${fmtHe(q.checkin)} – ${fmtHe(q.checkout)}`,
      intro: data.intro || `מוצעת בזאת חופשת סקי בוואל טורנס, צרפת, בתאריכים ${fmtHe(q.checkin)} עד ${fmtHe(q.checkout)}, למשך ${q.nights ?? ""} לילות.`,
      sections: [...data.sections, flights, included, lodging, summary, price].filter(s => s.blocks.length > 0),
    });
  };

  const addSection = () => setD({ sections: [...data.sections, { heading: "סעיף חדש", blocks: [] }] });
  const addBlock = (si: number, type: string) => { const s = data.sections[si]; setSection(si, { ...s, blocks: [...s.blocks, emptyBlock(type)] }); };
  const insertSaved = (sb: typeof SAVED_BLOCKS[number]) => {
    const idx = data.sections.findIndex(s => s.heading === sb.heading);
    if (idx >= 0) setSection(idx, { ...data.sections[idx], blocks: [...data.sections[idx].blocks, sb.block] });
    else setD({ sections: [...data.sections, { heading: sb.heading, blocks: [sb.block] }] });
  };

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
              <input className={input} dir="ltr" placeholder="הדבק/י קישור להצעה  (/q/...)  או קוד הזמנה"
                value={srcUrl} onChange={e => setSrcUrl(e.target.value)} />
              <button onClick={prefillFromSource} className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 rounded-lg">משוך ומלא ↺</button>
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
            {SAVED_BLOCKS.map((sb, i) => (
              <button key={i} onClick={() => insertSaved(sb)} className="border border-gray-200 text-gray-700 font-semibold text-xs px-3 py-2 rounded-xl">➕ {sb.name}</button>
            ))}
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
      {(block.type === "banner" || block.type === "text" || block.type === "note") && (
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
        <textarea className={input} rows={4} placeholder="מפתח = ערך (שורה לכל זוג)"
          value={block.rows.map(r => `${r[0]} = ${r[1]}`).join("\n")}
          onChange={e => onChange({ ...block, rows: e.target.value.split("\n").map(l => { const idx = l.indexOf("="); return idx < 0 ? [l.trim(), ""] : [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; }) as [string, string][] })} />
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
