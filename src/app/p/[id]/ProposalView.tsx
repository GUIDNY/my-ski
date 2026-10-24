"use client";
import { useState } from "react";
import Link from "next/link";
import { wrap, card, btn, h1, chip, Crumbs, Check } from "@/components/ui";
import { PhotoGallery, Lightbox } from "@/components/QuoteView";
import { heroOf } from "@/components/ProposalDocument";
import { BANK } from "@/lib/bank";
import type { ProposalBlock, ProposalData } from "@/types";

/*
 * A quote the bots made, as a page in the look of the site's own quote page:
 * photos, the offer in sections, and on the side (or at the bottom on a
 * phone) the price, the payment links, the PDF and WhatsApp.
 */

const isoToIl = (s: string) => s.replace(/(\d{4})-(\d{2})-(\d{2})/g, (_m, y, m, d) => `${Number(d)}.${Number(m)}.${y}`);
const clean = (s: string) => isoToIl(s).replace(/\s*[←→]\s*/g, " ").replace(/\s+—\s+/g, " · ").replace(/(\d)\s+–\s+(\d)/g, "$1 עד $2").trim();
const INC: [string, string][] = [["apartment", "דירה"], ["skipass", "סקי פס"], ["transfer", "הסעה מהשדה"], ["equipment", "ציוד סקי"], ["flight", "טיסה ישירה"]];

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

function Lines({ block }: { block: Extract<ProposalBlock, { type: "table" }> }) {
  return (
    <div className={`${card} divide-y divide-line`}>
      {block.rows.map((r, i) => {
        const amount = r[r.length - 1];
        const sub = r.slice(1, -1).filter(c => c && c !== "-").join(" · ");
        return (
          <div key={i} className="flex items-start justify-between gap-4 px-4 md:px-5 py-3.5">
            <div className="min-w-0">
              <p className="text-[15px] md:text-[16px] font-bold text-ink">{clean(r[0])}</p>
              {sub && <p className="text-[13px] md:text-[14px] text-muted mt-0.5">{sub}</p>}
            </div>
            <span className="text-[15px] md:text-[16px] font-bold text-ink tabular-nums shrink-0">{amount}</span>
          </div>
        );
      })}
      {block.total && (
        <div className="flex items-center justify-between gap-4 px-4 md:px-5 py-4 bg-soft rounded-b-card">
          <span className="text-[16px] font-bold text-ink">{block.total[0]}</span>
          <span className="font-display font-extrabold text-[20px] text-ink tabular-nums">{block.total[block.total.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

function BlockView({ b }: { b: ProposalBlock }) {
  switch (b.type) {
    case "kv": case "summary": return <Rows rows={b.rows} />;
    case "table": return <Lines block={b} />;
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
        <p className="text-[16px] font-bold text-ink">{b.direction === "return" ? "טיסת חזור" : "טיסת הלוך"}{b.date ? ` · ${b.date}` : ""}</p>
        <p className="text-[15px] text-body">{[b.from, b.to].filter(Boolean).join(" – ")}{b.airline ? ` · ${b.airline}` : ""}</p>
        {(b.depart || b.arrive) && <p className="text-[15px] text-body">{b.depart ? `המראה ${b.depart}` : ""}{b.arrive ? ` · נחיתה ${b.arrive}` : ""}</p>}
        <p className="text-[14px] text-muted">{b.nonstop ? "טיסה ישירה" : "עם עצירה"}</p>
      </div>
    );
    default: return null;
  }
}

export default function ProposalView({ id, data, number }: { id: string; data: ProposalData; number: string | null }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showBank, setShowBank] = useState(false);
  const h = heroOf(data);
  const blocks = data.sections.flatMap(s => s.blocks);
  const imgs = Array.from(new Set([...(h.image ? [h.image] : []), ...blocks.flatMap(b => (b.type === "gallery" ? b.urls : []))]));
  const pays = blocks.filter((b): b is Extract<ProposalBlock, { type: "payment" }> => b.type === "payment" && !!b.url);
  const pdf = `/api/proposals/${id}/pdf`;
  const wa = `https://wa.me/972555174903?text=${encodeURIComponent(`היי, לגבי הצעת המחיר${number ? ` ${number}` : ""}: `)}`;
  const main = data.sections
    .filter(s => s.heading !== "תנאים")
    .map(s => ({ heading: s.heading, blocks: s.blocks.filter(b => b.type !== "payment" && b.type !== "gallery") }))
    .filter(s => s.blocks.length);
  const terms = data.sections.find(s => s.heading === "תנאים");

  const payPanel = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[15px] text-muted">המחיר לאדם</span>
        {h.perPerson && <span className="font-display font-extrabold text-[40px] leading-none text-ink tabular-nums">{h.perPerson}</span>}
        {h.total && <span className="text-[15px] text-muted mt-1">סה״כ {h.total}{h.guests ? ` ל-${h.guests} אנשים` : ""}</span>}
      </div>
      <ul className="flex flex-col gap-2">
        {INC.map(([k, label]) => {
          const on = h.included.includes(k as never);
          return (
            <li key={k} className={`flex items-center gap-2 text-[15px] ${on ? "text-ink" : "text-muted line-through decoration-line-strong"}`}>
              {on ? <Check /> : <span className="w-4 text-center text-muted" aria-hidden="true">–</span>}{label}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2.5">
        {pays.map((p, i) => (
          <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className={`${i === 0 ? btn.primary : btn.outline} w-full`}>
            {clean(p.label || "לתשלום מאובטח").replace(/^לתשלום/, i === 0 ? "לתשלום" : "או")}
          </a>
        ))}
        <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn.outline} w-full`}>שאלה? וואטסאפ</a>
        <a href={pdf} className={`${btn.link} self-center min-h-[44px]`}>להוריד את ההצעה כ-PDF</a>
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
      <p className="text-[13px] text-muted leading-relaxed">תשלום מאובטח ב-PayPlus. בכרטיס נוספת עמלת סליקה של 1.9%.{h.validUntil ? ` ההצעה בתוקף עד ${h.validUntil}, וכפופה לזמינות.` : ""}</p>
    </div>
  );

  return (
    <div className="bg-white text-ink" dir="rtl">
      <div className={`${wrap} pt-5 md:pt-7`}>
        <Crumbs items={[{ label: "דף הבית", href: "/" }, { label: "הצעת מחיר" }]} />
        <div className="flex flex-wrap items-end justify-between gap-4 mt-3 md:mt-4">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="self-start inline-flex items-center rounded-full bg-accent-soft text-accent text-[13px] font-bold px-3 py-1">הצעת מחיר אישית{number ? ` · ${number}` : ""}</span>
            <h1 className={h1}>{data.title}</h1>
            <span className="text-[16px] md:text-[17px] text-muted">ואל טורנס, צרפת</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {h.chips.map((c, i) => <span key={i} className={chip}>{c}</span>)}
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
          {main.map((s, i) => (
            <section key={i} className="flex flex-col gap-4">
              <h2 className="font-display font-bold text-[22px] md:text-[26px] tracking-tight text-ink">{clean(s.heading)}</h2>
              {s.blocks.map((b, j) => <BlockView key={j} b={b} />)}
            </section>
          ))}
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
          <span className="flex items-baseline gap-1"><span className="font-display font-extrabold text-[22px] text-ink tabular-nums">{h.perPerson}</span><span className="text-[13px] text-muted">לאדם</span></span>
          {h.total && <span className="text-[12px] text-muted tabular-nums">{h.total} לכל החבורה</span>}
        </div>
        <a href="#pay" className={`${btn.primary} flex-1`}>לתשלום</a>
      </div>

      <Lightbox imgs={imgs} index={lightbox} setIndex={setLightbox} name={data.title} />
    </div>
  );
}
