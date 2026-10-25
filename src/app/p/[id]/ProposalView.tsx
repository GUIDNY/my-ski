"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { wrap, card, btn, h1, chip, Crumbs, Check } from "@/components/ui";
import { PhotoGallery, Lightbox, mapLink } from "@/components/QuoteView";
import { heroOf } from "@/components/ProposalDocument";
import { BANK } from "@/lib/bank";
import type { ProposalBlock, ProposalData } from "@/types";

/*
 * A quote the bots made, as a page in the look of the site's own quote page:
 * photos, the offer in sections, and on the side (or at the bottom on a
 * phone) the price, what's included (equipment, transfer, ski pass can be
 * taken out, equipment can be added), payment in euro or shekels for the
 * group or per person, bank transfer, the PDF and WhatsApp.
 */

const isoToIl = (s: string) => s.replace(/(\d{4})-(\d{2})-(\d{2})/g, (_m, y, m, d) => `${Number(d)}.${Number(m)}.${y}`);
const clean = (s: string) => isoToIl(s).replace(/\s*[←→]\s*/g, " ").replace(/\s+—\s+/g, " · ").replace(/(\d)\s+–\s+(\d)/g, "$1 עד $2").trim();
const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const money = (s: string) => Number(String(s).replace(/[^\d.]/g, "")) || 0;
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
const KIND_LABEL: Record<string, string> = { equipment: "ציוד סקי", transfer: "הסעה מהשדה", skipass: "סקי פס", flight: "טיסה ישירה", bag: "מזוודה" };

function Rows({ rows }: { rows: string[][] }) {
  return (
    <dl className={`${card} divide-y divide-line`}>
      {rows.map((r, i) => (
        <div key={i} className="flex items-start justify-between gap-4 px-4 md:px-5 py-3">
          <dt className="text-[15px] text-muted">{r[0]}</dt>
          <dd className="text-[15px] font-bold text-ink text-left">{clean(r.slice(1).join(" "))}</dd>
        </div>
      ))}
    </dl>
  );
}

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={`relative shrink-0 w-[46px] h-[28px] rounded-full transition-colors ${on ? "bg-accent" : "bg-line-strong"}`}>
      <span className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-[right] ${on ? "right-[3px]" : "right-[21px]"}`} />
    </button>
  );
}

function Qty({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2.5 mt-2">
      <span className="text-[14px] text-muted">לכמה אנשים</span>
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} aria-label="פחות"
        className="w-9 h-9 rounded-full border border-line-strong bg-white text-ink text-[18px] leading-none disabled:opacity-40">−</button>
      <span className="font-bold text-[16px] text-ink w-5 text-center tabular-nums" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="עוד"
        className="w-9 h-9 rounded-full border border-line-strong bg-white text-ink text-[18px] leading-none disabled:opacity-40">+</button>
    </div>
  );
}

function BlockView({ b }: { b: ProposalBlock }) {
  switch (b.type) {
    case "kv": case "summary": return <Rows rows={b.rows} />;
    case "text": return <p className="text-[16px] leading-[1.75] text-body whitespace-pre-line">{b.text}</p>;
    case "note": return <p className="text-[14px] leading-relaxed text-muted">{b.text}</p>;
    case "list": return (
      <ul className="flex flex-col gap-2 text-[15px] text-ink">
        {b.items.map((it, i) => <li key={i} className="flex items-start gap-2"><Check className="mt-[4px]" />{it}</li>)}
      </ul>
    );
    case "banner": return <p className="text-[16px] font-bold text-ink">{clean(b.text)}</p>;
    case "option": return <div className={`${card} p-4`}><p className="font-bold text-ink mb-1">{b.label}</p><p className="text-[15px] text-body">{b.text}</p></div>;
    case "flight": return (
      <div className={`${card} p-4 md:p-5 flex flex-col gap-1`}>
        <p className="text-[16px] font-bold text-ink">{b.direction === "return" ? "טיסת חזור" : "טיסת הלוך"}{b.date ? ` · ${isoToIl(b.date)}` : ""}</p>
        <p className="text-[15px] text-body">{[b.from, b.to].filter(Boolean).join(" – ")}{b.airline ? ` · ${b.airline}` : ""}</p>
        {(b.depart || b.arrive) && <p className="text-[15px] text-body">{b.depart ? `המראה ${b.depart}` : ""}{b.arrive ? ` · נחיתה ${b.arrive}` : ""}</p>}
        <p className="text-[14px] text-muted">{b.nonstop ? "טיסה ישירה" : "עם עצירה"}</p>
      </div>
    );
    default: return null;
  }
}

export default function ProposalView({ id, data, number, clientName, pdfHref }: { id: string; data: ProposalData; number: string | null; clientName: string | null; pdfHref?: string }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showBank, setShowBank] = useState(false);
  const [off, setOff] = useState<number[]>([]);          // rows taken out
  const [addEquip, setAddEquip] = useState(false);
  const [qty, setQty] = useState<Record<number, number>>({});   // how many people for each add-on
  const [equipQty, setEquipQty] = useState(0);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [notMine, setNotMine] = useState<string[]>([]);  // add-ons the person paying their own share does not take
  const [busy, setBusy] = useState<string>("");
  const [payErr, setPayErr] = useState(false);
  const [pdfState, setPdfState] = useState<"" | "busy" | "link" | "error">("");
  const [mapHref, setMapHref] = useState<string | null>(null);
  const [aptHref, setAptHref] = useState<string | null>(null);
  const [apts, setApts] = useState<{ id: string; name: string; images?: string[] | null; map_url?: string | null }[]>([]);

  const h = heroOf(data);
  const blocks = data.sections.flatMap(s => s.blocks);
  const imgs = Array.from(new Set([...(h.image ? [h.image] : []), ...blocks.flatMap(b => (b.type === "gallery" ? b.urls : []))]));
  const table = blocks.find((b): b is Extract<ProposalBlock, { type: "table" }> => b.type === "table");
  const allText = JSON.stringify(data.sections) + " " + (data.subtitle || "") + " " + h.chips.join(" ");
  const guests = h.guests || Number(allText.match(/(\d+)\s*(?:אנשים|אורחים)/)?.[1]) || Number(allText.match(/"מספר אורחים","(\d+)"/)?.[1]) || 1;
  const nights = Number(allText.match(/(\d+)\s*לילות/)?.[1]) || 7;
  const skiDays = Math.max(nights - 1, 0);
  const four = (table?.header?.length ?? 0) >= 4; // the bots' table: item, quantity, unit price, total
  const lines = (table?.rows ?? []).map((r, i) => {
    const kind = kindOf(r[0]);
    const amount = money(r[r.length - 1]);
    const baseQty = Number(String(r[0]).match(/×\s*(\d+)/)?.[1]) || (four ? Number(String(r[1]).match(/^\d+$/)?.[0]) : 0) || 0;
    // per person (ski pass, equipment, flight, bag, a per-seat transfer); a private car is one price for the group
    const perHead = !!kind && baseQty > 0 && (kind !== "transfer" || baseQty > 1);
    return { i, label: clean(r[0]).replace(/\s*×\s*\d+$/, ""), sub: r.slice(1, -1).filter(c => c && c !== "-").join(" · "), amount, shown: r[r.length - 1], kind, baseQty, perHead, unit: perHead ? amount / baseQty : amount };
  });
  const hasEquip = lines.some(l => l.kind === "equipment");
  const equipAdd = !hasEquip && h.included.includes("skipass" as never) ? equipCost(skiDays) * guests : 0;
  const baseTotal = table?.total ? money(table.total[table.total.length - 1]) : money(h.total || "0");
  const qtyOf = (l: (typeof lines)[number]) => (l.perHead ? Math.min(Math.max(qty[l.i] ?? l.baseQty, 1), guests) : l.baseQty);
  const nowOf = (l: (typeof lines)[number]) => (off.includes(l.i) ? 0 : l.perHead ? l.unit * qtyOf(l) : l.amount);
  const equipNow = addEquip ? equipCost(skiDays) * Math.min(Math.max(equipQty, 1), guests) : 0;
  const total = baseTotal + lines.reduce((sum, l) => sum + nowOf(l) - l.amount, 0) + equipNow;
  const perPerson = total / guests;
  // one person's share: the shared part (apartment, a private car, cancellation...) split equally,
  // plus the add-ons this person takes (when only some of the group take one, each pays their own)
  const mineItems = [
    ...lines.filter(l => l.perHead && !off.includes(l.i) && qtyOf(l) > 0).map(l => ({ key: `l${l.i}`, label: KIND_LABEL[l.kind || ""] || l.label, unit: l.unit, qty: qtyOf(l) })),
    ...(addEquip ? [{ key: "eq", label: "ציוד סקי", unit: equipCost(skiDays), qty: Math.min(Math.max(equipQty, 1), guests) }] : []),
  ];
  const sharedPer = (total - mineItems.reduce((sum, m) => sum + m.unit * m.qty, 0)) / guests;
  const uneven = mineItems.some(m => m.qty < guests);
  const myShare = sharedPer + mineItems.filter(m => !notMine.includes(m.key)).reduce((sum, m) => sum + m.unit, 0);
  const myNote = uneven ? mineItems.filter(m => m.qty < guests).map(m => `${notMine.includes(m.key) ? "בלי" : "עם"} ${m.label}`).join(", ") : "";
  const changed = off.length > 0 || addEquip || lines.some(l => l.perHead && qtyOf(l) !== l.baseQty);
  const kinds = new Set(lines.filter(l => !off.includes(l.i)).map(l => l.kind).filter(Boolean) as string[]);
  if (addEquip) kinds.add("equipment");
  const inc: [string, string, boolean][] = [["apartment", "דירה", true], ...(["skipass", "transfer", "equipment", "flight"] as const).map(k => [k, KIND_LABEL[k], kinds.has(k)] as [string, string, boolean])];
  const pdf = pdfHref || `/api/proposals/${id}/pdf`;

  const main = data.sections
    .filter(s => s.heading !== "תנאים" && s.heading !== "תשלום")
    .map(s => ({ heading: s.heading, blocks: s.blocks.filter(b => b.type !== "payment" && b.type !== "gallery") }))
    .filter(s => s.blocks.length);
  const terms = data.sections.find(s => s.heading === "תנאים");
  const forName = clientName && !/^(לקוח יקר|Dear guest|בדיקה|test)$/i.test(clientName.trim()) ? clientName.trim() : "";

  // the apartment on the map, when we have its location
  useEffect(() => {
    let live = true;
    fetch("/api/apartments").then(r => (r.ok ? r.json() : [])).then((apts: { id: string; name: string; images?: string[] | null; map_url?: string | null }[]) => {
      if (!live || !Array.isArray(apts)) return;
      setApts(apts);
      const a = apts.find(x => x.name && data.title.includes(x.name)) || apts.find(x => x.name && x.name.includes(data.title));
      if (!a) return;
      setAptHref(`/apartments/${a.id}`);
      setMapHref(mapLink(a.map_url));
    }).catch(() => {});
    return () => { live = false; };
  }, [data.title]);

  const toggle = (i: number) => setOff(v => (v.includes(i) ? v.filter(x => x !== i) : [...v, i]));
  const changes = [
    ...lines.filter(l => off.includes(l.i)).map(l => "בלי " + (KIND_LABEL[l.kind || ""] || l.label)),
    ...lines.filter(l => !off.includes(l.i) && l.perHead && qtyOf(l) !== l.baseQty).map(l => `${KIND_LABEL[l.kind || ""] || l.label} ל-${qtyOf(l)}`),
    ...(addEquip ? [`עם ציוד ל-${Math.min(Math.max(equipQty, 1), guests)}`] : []),
  ];
  const what = changes.length ? ` (${changes.join(", ")})` : "";
  const wa = `https://wa.me/972555174903?text=${encodeURIComponent(`היי, לגבי הצעת המחיר${number ? ` ${number}` : ""}${changes.length ? ` (שיניתי: ${changes.join(", ")})` : ""}: `)}`;
  const pay = async (key: string, amount: number, currency: "EUR" | "ILS", perHead: boolean) => {
    if (busy) return;
    setBusy(key); setPayErr(false);
    try {
      const r = await fetch("/api/payplus/create-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(amount * 100) / 100, currency, name: forName || undefined, ref: pdfHref ? undefined : `p:${id}`, description: `הצעה ${number || ""}${perHead ? ` · החלק של אדם אחד${myNote ? ` (${myNote})` : ""}` : ""}${what}`.trim() }),
      });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error("no link");
      window.location.href = j.url;
    } catch { setPayErr(true); setBusy(""); }
  };
  const payOptions: [string, string, number, "EUR" | "ILS", boolean][] = [
    ["eur", `לתשלום ביורו · ${eur(total)}`, total, "EUR", false],
    ["ils", "בשקלים, כל הסכום", total, "ILS", false],
    ...(guests > 1 ? [
      ["pp-eur", `רק החלק שלי ביורו · ${eur(myShare)}`, myShare, "EUR", true] as [string, string, number, "EUR" | "ILS", boolean],
      ["pp-ils", "רק החלק שלי בשקלים", myShare, "ILS", true] as [string, string, number, "EUR" | "ILS", boolean],
    ] : []),
  ];

  // phones and the app: the share sheet with the file (save it, send it); a computer downloads it
  const getPdf = async () => {
    if (pdfState === "busy") return;
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    const phone = !!w.Capacitor?.isNativePlatform?.() || /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);
    setPdfState("busy");
    try {
      const res = await fetch(pdf);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const fileName = `הצעת מחיר SkiShare - ${data.title}.pdf`.replace(/[\\/:*?"<>|]/g, "");
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (phone && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `הצעת מחיר, ${data.title}` }); } catch { /* closed */ }
        setPdfState("");
      } else if (phone) {
        setPdfState("link");
      } else {
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = href; a.download = fileName;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(href), 30000);
        setPdfState("");
      }
    } catch { setPdfState("error"); }
  };

  const lineList = table && (
    <div className={`${card} divide-y divide-line`}>
      {lines.map(l => {
        const isOff = off.includes(l.i);
        const q = qtyOf(l);
        const open = openRow === l.i && l.perHead && !isOff;
        return (
          <div key={l.i} className="px-4 md:px-5 py-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className={`min-w-0 ${isOff ? "opacity-50" : ""}`}>
                <p className={`text-[15px] md:text-[16px] font-bold text-ink ${isOff ? "line-through" : ""}`}>{l.label}{l.perHead ? ` × ${q}` : ""}</p>
                <p className="text-[13px] md:text-[14px] text-muted mt-0.5">{l.perHead ? `${eur(l.unit)} לאדם` : l.sub}</p>
                {l.perHead && !isOff && (
                  <button type="button" onClick={() => setOpenRow(open ? null : l.i)} aria-expanded={open}
                    className="mt-1 inline-flex items-center gap-1 min-h-[32px] text-[13px] font-bold text-accent">
                    {open ? "סגירה" : "לכמה אנשים?"}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[15px] md:text-[16px] font-bold tabular-nums ${isOff ? "text-muted line-through" : "text-ink"}`}>{l.perHead ? eur(l.unit * q) : l.shown}</span>
                {l.kind && l.kind !== "flight" && l.kind !== "bag" && <Switch on={!isOff} onClick={() => toggle(l.i)} label={`${KIND_LABEL[l.kind]}: ${isOff ? "להחזיר" : "להוריד"}`} />}
              </div>
            </div>
            {open && <Qty value={q} max={guests} onChange={v => setQty(m => ({ ...m, [l.i]: v }))} />}
          </div>
        );
      })}
      {equipAdd > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-3.5">
          <div className={`min-w-0 ${addEquip ? "" : "opacity-70"}`}>
            <p className="text-[15px] md:text-[16px] font-bold text-ink">ציוד סקי או סנובורד × {addEquip ? Math.min(Math.max(equipQty, 1), guests) : guests}</p>
            <p className="text-[13px] md:text-[14px] text-muted mt-0.5">{skiDays} ימי גלישה · {eur(equipCost(skiDays))} לאדם</p>
            {addEquip && <Qty value={Math.min(Math.max(equipQty, 1), guests)} max={guests} onChange={setEquipQty} />}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-[15px] md:text-[16px] font-bold tabular-nums ${addEquip ? "text-ink" : "text-muted"}`}>+{eur(addEquip ? equipNow : equipAdd)}</span>
            <Switch on={addEquip} onClick={() => { setAddEquip(v => !v); setEquipQty(q0 => q0 || guests); }} label="להוסיף ציוד" />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-4 bg-soft rounded-b-card">
        <span className="text-[16px] font-bold text-ink">סה״כ לכל החבורה</span>
        <span className="font-display font-extrabold text-[20px] text-ink tabular-nums">{eur(total)}</span>
      </div>
    </div>
  );

  const payPanel = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[15px] text-muted">{uneven ? "המחיר לאדם, בממוצע" : "המחיר לאדם"}</span>
        <span className="font-display font-extrabold text-[40px] leading-none text-ink tabular-nums">{eur(perPerson)}</span>
        <span className="text-[15px] text-muted mt-1">סה״כ {eur(total)} ל-{guests} {guests === 1 ? "אדם" : "אנשים"}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {inc.map(([k, label, on]) => (
          <li key={k} className={`flex items-center gap-2 text-[15px] ${on ? "text-ink" : "text-muted"}`}>
            {on ? <Check /> : <span className="w-4 text-center" aria-hidden="true">–</span>}{label}{on ? "" : " (לא כלול)"}
          </li>
        ))}
      </ul>
      {changed && <p className="text-[13px] text-accent font-bold">המחיר עודכן לפי מה שבחרתם</p>}
      {guests > 1 && uneven && (
        <div className="rounded-2xl bg-soft p-4 flex flex-col gap-2.5">
          <p className="text-[15px] font-bold text-ink">משלמים כל אחד לחוד? מה יש לך:</p>
          {mineItems.filter(m => m.qty < guests).map(m => {
            const on = !notMine.includes(m.key);
            return (
              <label key={m.key} className="flex items-center justify-between gap-3 text-[15px] text-ink cursor-pointer">
                <span className="flex items-center gap-2.5">
                  <input type="checkbox" checked={on} onChange={() => setNotMine(v => (on ? [...v, m.key] : v.filter(x => x !== m.key)))} className="w-5 h-5 accent-[#1652F0]" />
                  {m.label} <span className="text-muted text-[13px]">({m.qty} מתוך {guests})</span>
                </span>
                <span className="tabular-nums text-muted">+{eur(m.unit)}</span>
              </label>
            );
          })}
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2.5">
            <span className="text-[15px] text-muted">החלק שלי</span>
            <span className="font-display font-extrabold text-[22px] text-ink tabular-nums">{eur(myShare)}</span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2.5">
        {payOptions.map(([key, label, amount, currency, perHead], i) => (
          <button key={key} type="button" disabled={!!busy} onClick={() => pay(key, amount, currency, perHead)} className={`${i === 0 ? btn.primary : btn.outline} w-full`}>
            {busy === key ? "פותחים תשלום מאובטח…" : label}
          </button>
        ))}
        {payErr && <p className="text-[13px] text-danger text-center">לא הצלחנו לפתוח את התשלום. נסו שוב, או כתבו לנו בוואטסאפ.</p>}
        <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn.outline} w-full`}>שאלה? וואטסאפ</a>
        <button type="button" onClick={getPdf} disabled={pdfState === "busy"} className={`${btn.link} self-center min-h-[44px]`}>
          {pdfState === "busy" ? "מכינים את ה-PDF…" : "להוריד את ההצעה כ-PDF"}
        </button>
        {pdfState === "link" && <a href={pdf} target="_blank" rel="noopener" className={`${btn.link} self-center min-h-[44px]`}>לפתוח את ה-PDF</a>}
        {pdfState === "error" && <p className="text-[13px] text-danger text-center">לא הצלחנו להכין PDF כרגע. נסו שוב עוד רגע.</p>}
      </div>
      <div className="rounded-2xl border border-line">
        <button type="button" onClick={() => setShowBank(v => !v)} aria-expanded={showBank} className="w-full flex items-center justify-between gap-3 px-4 min-h-[52px] text-[15px] font-bold text-ink">
          בהעברה בנקאית, בלי עמלה
          <span className="text-accent text-[14px]">{showBank ? "להסתיר" : "לפרטים"}</span>
        </button>
        {showBank && (
          <dl className="px-4 pb-3 divide-y divide-line text-[14px]">
            {[["בנק", BANK.name], ["סניף", BANK.branch], ["חשבון", BANK.account], ["IBAN", BANK.iban], ["SWIFT", BANK.swift], ["מוטב", BANK.holder]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-muted">{k}</dt><dd dir="ltr" className="font-bold text-ink">{v}</dd></div>
            ))}
          </dl>
        )}
      </div>
      <p className="text-[13px] text-muted leading-relaxed">תשלום מאובטח ב-PayPlus, עד 3 תשלומים בלי ריבית. בכרטיס נוספת עמלת סליקה של 1.9%.{h.validUntil ? ` ההצעה בתוקף עד ${h.validUntil}, וכפופה לזמינות.` : ""}</p>
    </div>
  );

  return (
    <div className="bg-white text-ink" dir="rtl">
      <div className={`${wrap} pt-5 md:pt-7`}>
        <Crumbs items={[{ label: "דף הבית", href: "/" }, { label: "הצעת מחיר" }]} />
        <div className="flex flex-wrap items-end justify-between gap-4 mt-3 md:mt-4">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="self-start inline-flex items-center rounded-full bg-accent-soft text-accent text-[13px] font-bold px-3 py-1">
              {forName ? `הצעת מחיר עבור ${forName}` : "הצעת מחיר אישית"}{number ? ` · ${number}` : ""}
            </span>
            <h1 className={h1}>{data.title}</h1>
            <span className="text-[16px] md:text-[17px] text-muted">ואל טורנס, צרפת</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {h.chips.map((c, i) => <span key={i} className={chip}>{c}</span>)}
            {mapHref && (
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className={`${chip} hover:border-line-strong transition-colors`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                המיקום במפה
              </a>
            )}
          </div>
        </div>
        {imgs.length > 0 && (
          <div className="mt-5 md:mt-6">
            <PhotoGallery imgs={imgs} name={data.title} idx={Math.min(imgIdx, imgs.length - 1)} setIdx={setImgIdx} onOpen={setLightbox} />
          </div>
        )}
      </div>

      <div className={`${wrap} pt-8 md:pt-10 pb-10 lg:pb-24 flex flex-col lg:flex-row gap-9 items-start`}>
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-10">
          {main.map((s, si) => (
            <section key={si} className="flex flex-col gap-4">
              <h2 className="font-display font-bold text-[22px] md:text-[26px] tracking-tight text-ink">{clean(s.heading)}</h2>
              {s.blocks.some(b => b.type === "table") && <p className="text-[15px] text-muted -mt-2">אפשר להוריד ציוד, הסעה או סקי פס{equipAdd > 0 ? ", או להוסיף ציוד" : ""}, והמחיר מתעדכן מיד.</p>}
              {s.blocks.map((b, j) => (b.type === "table" ? <div key={j}>{lineList}</div> : <BlockView key={j} b={b} />))}
              {aptHref && /על הדירה/.test(s.heading) && <Link href={aptHref} className={`${btn.link}`}>לדף הדירה באתר ‹</Link>}
            </section>
          ))}
          {data.upgrades && data.upgrades.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-display font-bold text-[22px] md:text-[26px] tracking-tight text-ink">רוצים לשדרג?</h2>
                <p className="text-[15px] text-muted">עוד דירות שפנויות בתאריכים שלכם. כותבים לנו ואנחנו מעדכנים את ההצעה.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {data.upgrades.map((u, i) => {
                  const a = apts.find(x => x.name === u.name);
                  const img = a?.images?.[0];
                  const ask = `https://wa.me/972555174903?text=${encodeURIComponent(`היי, לגבי הצעת המחיר${number ? ` ${number}` : ""}: אשמח לשדרג ל${u.name}`)}`;
                  return (
                    <div key={i} className={`${card} overflow-hidden flex flex-col`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {img ? <img src={img} alt={u.name} className="w-full h-[170px] object-cover bg-soft" loading="lazy" /> : null}
                      <div className="p-4 flex flex-col gap-1.5 flex-1">
                        <p className="text-[17px] font-bold text-ink">{u.name}</p>
                        {u.maxGuests ? <p className="text-[14px] text-muted">עד {u.maxGuests} אנשים</p> : null}
                        <p className="text-[16px] font-bold text-accent mt-1">+{eur(u.extraPerPerson)} לאדם</p>
                        <div className="flex flex-wrap gap-2 mt-auto pt-2">
                          <a href={ask} target="_blank" rel="noopener noreferrer" className={`${btn.outline} min-h-[44px] px-4 text-[15px]`}>לשדרג לדירה הזו</a>
                          {a && <Link href={`/apartments/${a.id}`} className={`${btn.link} min-h-[44px]`}>לראות את הדירה ‹</Link>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {terms && (
            <details className={`${card} p-5`}>
              <summary className="cursor-pointer text-[16px] font-bold text-ink">תנאים</summary>
              <div className="mt-3 flex flex-col gap-2">{terms.blocks.map((b, j) => <BlockView key={j} b={b} />)}</div>
              <Link href="/terms" target="_blank" className={`${btn.link} mt-3`}>התקנון המלא ומדיניות הביטולים ‹</Link>
            </details>
          )}
          <section id="pay" className={`lg:hidden ${card} p-5 scroll-mt-24`}>{payPanel}</section>
        </div>

        <aside aria-label="סיכום ההצעה" className="hidden lg:block w-[380px] shrink-0 sticky top-[96px] bg-white border border-line rounded-[24px] shadow-card p-6">
          <p className="text-[18px] font-bold text-ink mb-4">ההצעה שלכם</p>
          {payPanel}
        </aside>
      </div>

      <div className="lg:hidden sticky bottom-0 z-40 bg-white border-t border-line px-4 pt-3 flex items-center gap-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)", boxShadow: "0 -8px 24px rgba(11,27,51,0.08)" }}>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="flex items-baseline gap-1"><span className="font-display font-extrabold text-[22px] text-ink tabular-nums">{eur(perPerson)}</span><span className="text-[13px] text-muted">לאדם</span></span>
          <span className="text-[12px] text-muted tabular-nums">{eur(total)} לכל החבורה</span>
        </div>
        <a href="#pay" className={`${btn.primary} flex-1`}>לתשלום</a>
      </div>

      <Lightbox imgs={imgs} index={lightbox} setIndex={setLightbox} name={data.title} />
    </div>
  );
}
