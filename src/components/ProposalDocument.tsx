import type { ProposalData, ProposalBlock, ProposalHero } from "@/types";
import type { ReactNode } from "react";
import QRCode from "qrcode";
import { BANK } from "@/lib/bank";
import { DEFAULT_TERMS_SECTION, MANDATORY_TERM_BLOCKS } from "@/lib/proposal-demo";

// Retired inline cancellation-days/percentage clause (e.g. "30 יום ... 50% החזר").
// Cancellations are now governed solely by the site's cancellation policy, so
// this text is stripped even from proposals that already had it baked in.
const RETIRED_TEXT_PREFIX = "ביטול עד 30 יום לפני מועד היציאה";

// Guarantees the mandatory legal disclosures (flights are external, subject to
// the site terms, approval+payment = acceptance) are present in the terms
// section of every proposal, including ones saved before these clauses existed,
// and strips any retired clauses that shouldn't appear anymore.
function withMandatoryTerms(sections: ProposalData["sections"]): ProposalData["sections"] {
  const idx = sections.findIndex(s => s.heading === "תנאים");
  if (idx === -1) return [...sections, DEFAULT_TERMS_SECTION];

  const blocks = sections[idx].blocks.filter(
    b => !(b.type === "text" && b.text.startsWith(RETIRED_TEXT_PREFIX))
  );
  const existingText = new Set(blocks.filter(b => b.type === "text").map(b => (b as { text: string }).text));
  const missing = MANDATORY_TERM_BLOCKS.filter(b => b.type === "text" && !existingText.has(b.text));

  const merged = [...sections];
  merged[idx] = { ...merged[idx], blocks: [...blocks, ...missing] };
  return merged;
}

/**
 * Branded proposal document. Pure & presentational — used by both the print
 * route (window.print) and, in future, a puppeteer PDF route. React escapes all
 * text nodes automatically, so user input is safe to render directly.
 */

// Visual language from the approved spec. Screen rules render an A4 sheet;
// print rules add @page margins + footer page numbers.
export const PROPOSAL_CSS = `
:root { --ink:#0B1B33; --body:#3D4B63; --muted:#51607A; --box:#F4F7FB; --line:#E3E9F2; --line2:#CBD5E3; --accent:#1652F0; --ok:#0F7A4F; }

/* screen: show a centred A4 sheet */
.proposal-screen { background:#EEF2F7; padding:24px 12px; min-height:100vh; }
.proposal {
  direction:rtl; color:var(--ink); font-size:10.5pt; line-height:1.7;
  font-family:var(--font-heebo),"Heebo","Segoe UI","Arial",sans-serif;
  background:#fff; width:210mm; max-width:100%; margin:0 auto;
  padding:16mm 16mm 20mm; box-shadow:0 10px 34px rgba(11,27,51,0.14); border-radius:3mm;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}
.proposal * { box-sizing:border-box; }
.proposal .cover { text-align:right; padding:0 0 6mm; margin-bottom:7mm; border-bottom:1px solid var(--line); }
.proposal .brand { display:flex; align-items:center; gap:2.5mm; margin-bottom:9mm; }
.proposal .brand img { height:7mm; width:auto; }
.proposal .brand span { font-family:var(--font-rubik),"Rubik",var(--font-heebo),sans-serif; font-weight:800; font-size:15pt; letter-spacing:-0.3px; color:var(--ink); }
.proposal .brand .tag { margin-inline-start:auto; font-family:inherit; font-weight:700; font-size:8.5pt; color:var(--accent); background:#EEF3FF; border-radius:10mm; padding:1mm 3.5mm; letter-spacing:0; }
.proposal h1 { font-family:var(--font-rubik),"Rubik",var(--font-heebo),sans-serif; font-size:22pt; line-height:1.15; margin:0 0 2mm; letter-spacing:-0.4px; font-weight:800; }
.proposal .sub { font-size:11.5pt; color:var(--muted); margin-bottom:0; }
.proposal .rule { display:none; }
.proposal .intro { background:var(--box); border:1px solid var(--line); border-radius:3mm; padding:4.5mm 5mm; margin-bottom:8mm; color:var(--body); text-align:justify; }
.proposal h2 { font-family:var(--font-rubik),"Rubik",var(--font-heebo),sans-serif; font-size:13pt; margin:8mm 0 3.5mm; padding-bottom:2mm; border-bottom:1px solid var(--line); font-weight:700; display:flex; align-items:center; gap:3mm; }
.proposal h2 .num { display:inline-flex; align-items:center; justify-content:center; background:var(--accent); color:#fff; width:7mm; height:7mm; border-radius:50%; font-size:9pt; font-family:var(--font-heebo),sans-serif; font-weight:700; flex:none; }
.proposal p { margin:0 0 2.5mm; text-align:justify; color:var(--body); }
.proposal ul { margin:0 0 3mm; padding-right:5mm; color:var(--body); }
.proposal ul li { margin-bottom:1.2mm; }
.proposal ul li::marker { color:var(--accent); }
.proposal .route { background:var(--ink); color:#fff; padding:2.6mm 4mm; font-weight:700; font-size:10.5pt; margin-bottom:2mm; border-radius:2mm; }
.proposal table.flt { width:100%; border-collapse:collapse; margin-bottom:4mm; font-size:10pt; }
.proposal table.flt td { padding:2mm 3mm; border-bottom:1px solid var(--line); }
.proposal table.flt td.k { color:var(--muted); width:38%; }
.proposal table.flt td.v { font-weight:700; }
.proposal .flight-link { display:inline-block; font-size:9.5pt; font-weight:700; color:var(--accent); text-decoration:none; margin:-1mm 0 4mm; }
.proposal .pay-btn { display:block; text-align:center; background:var(--accent); color:#fff; font-weight:700; font-size:12pt; text-decoration:none; border-radius:3mm; padding:4.5mm; margin-bottom:3mm; }
.proposal .opt { border:1px solid var(--line); border-radius:3mm; padding:3.5mm 4mm; margin-bottom:3mm; color:var(--body); }
.proposal .opt .lbl { font-weight:700; display:block; margin-bottom:1mm; color:var(--ink); }
.proposal table.sum { width:100%; border-collapse:separate; border-spacing:0; font-size:10pt; margin-bottom:4mm; border:1px solid var(--line); border-radius:3mm; overflow:hidden; }
.proposal table.sum tr:nth-child(odd) td { background:var(--box); }
.proposal table.sum td { padding:2.4mm 4mm; }
.proposal table.sum td.k { color:var(--muted); width:34%; }
.proposal table.sum td.v { font-weight:700; }
.proposal table.grid { width:100%; border-collapse:separate; border-spacing:0; font-size:10pt; margin-bottom:4mm; border:1px solid var(--line); border-radius:3mm; overflow:hidden; }
.proposal table.grid th { background:var(--ink); color:#fff; padding:2.4mm 3mm; text-align:right; font-size:9.5pt; font-weight:700; }
.proposal table.grid td { padding:2.4mm 3mm; border-bottom:1px solid var(--line); }
.proposal table.grid tr.total td { font-weight:800; border-bottom:none; background:#EEF3FF; color:var(--ink); font-size:10.5pt; }
.proposal .sign { margin-top:8mm; border:1px solid var(--line2); border-radius:3mm; padding:5mm; page-break-inside:avoid; }
.proposal .sign h3 { font-family:var(--font-rubik),"Rubik",var(--font-heebo),sans-serif; font-size:12pt; margin:0 0 2mm; font-weight:700; }
.proposal .sign-grid { display:grid; grid-template-columns:1fr 1fr; gap:6mm 10mm; margin-top:6mm; }
.proposal .line { border-bottom:1px solid var(--ink); height:8mm; margin-bottom:1.5mm; }
.proposal .cap { font-size:8.5pt; color:var(--muted); }
.proposal .note { font-size:9.5pt; color:var(--muted); }
/* sections may run over two pages; a heading stays with what follows it, and
   tables, photos and boxes never split */
.proposal section { page-break-inside:auto; }
.proposal h2 { break-after:avoid; page-break-after:avoid; }
.proposal table, .proposal .route, .proposal .opt, .proposal .intro, .proposal .pay-btn, .proposal .note { break-inside:avoid; page-break-inside:avoid; }
.proposal .doc-foot { break-before:avoid; page-break-before:avoid; }
.proposal .gallery { display:grid; grid-template-columns:repeat(3, 1fr); gap:2mm; margin-bottom:4mm; page-break-inside:avoid; }
.proposal .gallery img { width:100%; height:34mm; object-fit:cover; border-radius:2.5mm; }
.proposal .doc-foot { margin-top:9mm; padding-top:4mm; border-top:1px solid var(--line); display:flex; justify-content:space-between; gap:4mm; font-size:8.5pt; color:var(--muted); }

@media print {
  @page { size:A4; margin:16mm 16mm 18mm 16mm;
    @bottom-center { content:"SkiShare  ·  עמוד " counter(page) " מתוך " counter(pages); font-size:8pt; color:#8a96a8; } }
  html, body, div:has(> .proposal-screen) { background:#fff !important; }
  html, body { height:auto !important; min-height:0 !important; }
  div:has(> .proposal-screen) { min-height:0 !important; display:block !important; }
  body > :not(:has(.proposal-screen)) { display:none !important; }
  .proposal-screen { background:#fff !important; padding:0 !important; min-height:0 !important; }
  .no-print { display:none !important; }
  .proposal { width:auto; margin:0; padding:0; box-shadow:none; border-radius:0; }
}
`;

function Block({ block }: { block: ProposalBlock }) {
  switch (block.type) {
    case "banner":
      return <div className="route">{block.text}</div>;
    case "kv":
      return (
        <table className="flt"><tbody>
          {block.rows.map((r, i) => (<tr key={i}><td className="k">{r[0]}</td><td className="v">{r[1]}</td></tr>))}
        </tbody></table>
      );
    case "summary":
      return (
        <table className="sum"><tbody>
          {block.rows.map((r, i) => (<tr key={i}><td className="k">{r[0]}</td><td className="v">{r[1]}</td></tr>))}
        </tbody></table>
      );
    case "list":
      return <ul>{block.items.map((it, i) => <li key={i}>{it}</li>)}</ul>;
    case "text":
      return <p>{block.text}</p>;
    case "note":
      return <p className="note">{block.text}</p>;
    case "option":
      return <div className="opt"><span className="lbl">{block.label}</span>{block.text}</div>;
    case "flight": {
      const dir = block.direction === "return" ? "טיסת חזור" : "טיסת הלוך";
      return (
        <>
          <div className="route">{dir}{block.date ? ` — ${block.date}` : ""}{block.from || block.to ? `  ·  ${block.from} ← ${block.to}` : ""}</div>
          <table className="flt"><tbody>
            {block.airline && <tr><td className="k">חברת תעופה</td><td className="v">{block.airline}</td></tr>}
            {block.depart && <tr><td className="k">שעת המראה</td><td className="v">{block.depart}</td></tr>}
            {block.arrive && <tr><td className="k">שעת נחיתה</td><td className="v">{block.arrive}</td></tr>}
            <tr><td className="k">סוג טיסה</td><td className="v">{block.nonstop ? "ישירה" : "עם עצירה"}</td></tr>
            {block.price && <tr><td className="k">מחיר</td><td className="v">{block.price}</td></tr>}
          </tbody></table>
          {block.link && <a className="flight-link" href={block.link} target="_blank" rel="noopener noreferrer">צפייה בטיסה ←</a>}
        </>
      );
    }
    case "table":
      return (
        <table className="grid">
          <thead><tr>{block.header.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>
            {block.rows.map((row, ri) => (<tr key={ri}>{row.map((c, ci) => <td key={ci}>{c}</td>)}</tr>))}
            {block.total && block.total.length > 0 && (
              <tr className="total">{block.total.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
            )}
          </tbody>
        </table>
      );
    case "gallery":
      return (
        <div className="gallery">
          {block.urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt={block.caption ? `${block.caption} ${i + 1}` : `תמונה ${i + 1}`} />
          ))}
          {block.caption && <p className="cap">{block.caption}</p>}
        </div>
      );
    case "payment":
      return block.url ? (
        <a className="pay-btn" href={block.url} target="_blank" rel="noopener noreferrer">{block.label || "לתשלום מאובטח ←"}</a>
      ) : null;
    default:
      return null;
  }
}

/* ── the cover page ─────────────────────────────────────────────────────
 * Every quote opens with one full page: the apartment photo, the price per
 * person in big letters, what's included and a QR code to book. New quotes
 * pass data.hero; older ones are read from their own sections. */

export const COVER_CSS = `
.proposal .pcover { margin:0; height:263mm; display:flex; flex-direction:column; background:#fff; break-after:page; page-break-after:always; border-radius:3mm 3mm 0 0; overflow:hidden; }
.proposal .pc-hero { position:relative; height:132mm; border-radius:5mm; overflow:hidden; background:#0B1B33 center/cover no-repeat; color:#fff; }
.proposal .pc-hero::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(11,27,51,.55) 0%, rgba(11,27,51,0) 30%, rgba(11,27,51,.25) 55%, rgba(11,27,51,.92) 100%); }
.proposal .pc-top { position:absolute; z-index:1; top:12mm; right:14mm; left:14mm; display:flex; align-items:center; justify-content:space-between; }
.proposal .pc-brand { display:flex; align-items:center; gap:2.5mm; font-family:var(--font-rubik),"Rubik",sans-serif; font-weight:800; font-size:16pt; letter-spacing:-.3px; }
.proposal .pc-brand img { height:7mm; width:auto; }
.proposal .pc-tag { white-space:nowrap; font-weight:700; font-size:9pt; letter-spacing:.2px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.35); border-radius:20mm; padding:1.4mm 4mm; backdrop-filter:blur(4px); }
.proposal .pc-title { position:absolute; z-index:1; right:14mm; left:14mm; bottom:11mm; }
.proposal .pc-kicker { font-size:9.5pt; font-weight:700; letter-spacing:1.6px; text-transform:uppercase; opacity:.85; margin-bottom:2mm; }
.proposal .pc-title h1 { color:#fff; font-size:30pt; line-height:1.08; margin:0 0 2.5mm; letter-spacing:-.6px; }
.proposal .pc-title .pc-sub { font-size:12pt; opacity:.92; }
.proposal .pc-body { flex:1; padding:8mm 1mm 0; display:flex; flex-direction:column; gap:7mm; }
.proposal .pc-price { display:flex; align-items:stretch; gap:5mm; }
.proposal .pc-pp { flex:1.25; background:linear-gradient(135deg,#1652F0 0%,#0E3BB8 100%); color:#fff; border-radius:5mm; padding:6mm 7mm; position:relative; overflow:hidden; }
.proposal .pc-pp::after { content:""; position:absolute; width:60mm; height:60mm; left:-18mm; top:-26mm; border-radius:50%; background:rgba(255,255,255,.09); }
.proposal .pc-pp .l { font-size:10pt; font-weight:700; opacity:.9; }
.proposal .pc-pp .v { font-family:var(--font-rubik),"Rubik",sans-serif; font-weight:800; font-size:40pt; line-height:1; letter-spacing:-1px; margin:2mm 0 1.5mm; }
.proposal .pc-pp .s { font-size:9.5pt; opacity:.9; }
.proposal .pc-tot { flex:1; border:1.5px solid var(--line); border-radius:5mm; padding:6mm 6mm; display:flex; flex-direction:column; justify-content:center; gap:1.5mm; }
.proposal .pc-tot .l { font-size:9.5pt; color:var(--muted); font-weight:700; }
.proposal .pc-tot .v { font-family:var(--font-rubik),"Rubik",sans-serif; font-weight:800; font-size:22pt; color:var(--ink); line-height:1.1; }
.proposal .pc-tot .s { font-size:9pt; color:var(--muted); }
.proposal .pc-chips { display:flex; flex-wrap:wrap; gap:2.5mm; }
.proposal .pc-chips span { background:var(--box); border:1px solid var(--line); border-radius:20mm; padding:1.6mm 4mm; font-size:10pt; font-weight:700; color:var(--ink); }
.proposal .pc-h { font-family:var(--font-rubik),"Rubik",sans-serif; font-weight:800; font-size:12pt; margin:0 0 3mm; color:var(--ink); }
.proposal .pc-inc { display:grid; grid-template-columns:repeat(5,1fr); gap:3mm; }
.proposal .pc-inc div { border:1px solid var(--line); border-radius:4mm; padding:4mm 2mm 3.5mm; text-align:center; font-size:9.5pt; font-weight:700; color:var(--ink); background:#fff; }
.proposal .pc-inc div.off { color:#A5B0C2; background:var(--box); border-style:dashed; }
.proposal .pc-inc svg { display:block; margin:0 auto 2mm; }
.proposal .pc-inc .ck { display:block; font-size:8pt; font-weight:700; margin-top:1mm; color:var(--ok); }
.proposal .pc-inc div.off .ck { color:#A5B0C2; }
.proposal .pc-foot { margin-top:auto; display:flex; align-items:center; gap:6mm; padding:6mm 0 0; border-top:1px solid var(--line); }
.proposal .pc-qr { flex:none; width:30mm; height:30mm; padding:1.6mm; border:1px solid var(--line); border-radius:3mm; background:#fff; }
.proposal .pc-qr svg { width:100%; height:100%; display:block; }
.proposal .pc-cta { flex:1; }
.proposal .pc-cta b { display:block; font-family:var(--font-rubik),"Rubik",sans-serif; font-size:13pt; color:var(--ink); margin-bottom:1mm; }
.proposal .pc-cta p { margin:0 0 1.2mm; font-size:9.5pt; color:var(--body); text-align:right; }
.proposal .pc-trust { flex:none; width:58mm; display:flex; flex-direction:column; gap:1.8mm; font-size:9pt; color:var(--body); }
.proposal .pc-trust a { color:inherit; text-decoration:none; }
.proposal .pc-btn { display:inline-block; margin:1mm 0 1.6mm; background:var(--accent); color:#fff; font-weight:800; font-size:10.5pt; text-decoration:none; border-radius:20mm; padding:2mm 6mm; }
.proposal .pc-valid { font-size:8.5pt !important; color:var(--muted) !important; }
.proposal .pc-trust span::before, .proposal .pc-trust a::before { content:""; display:inline-block; width:2mm; height:2mm; border-radius:50%; background:var(--accent); margin-inline-end:2mm; vertical-align:middle; }
/* the payment card at the end */
.proposal .paycard { margin-top:8mm; border:1.5px solid var(--line); border-radius:5mm; overflow:hidden; break-inside:avoid; page-break-inside:avoid; }
.proposal .paycard .ph { background:var(--ink); color:#fff; padding:4mm 6mm; font-family:var(--font-rubik),"Rubik",sans-serif; font-weight:800; font-size:13pt; display:flex; justify-content:space-between; align-items:center; }
.proposal .paycard .ph span { font-family:var(--font-heebo),sans-serif; font-weight:700; font-size:9.5pt; opacity:.85; }
.proposal .paycard .pb { display:grid; grid-template-columns:1fr 1fr; }
.proposal .paycard .pb > div { padding:5mm 6mm; }
.proposal .paycard .pb > div + div { border-inline-start:1px solid var(--line); }
.proposal .paycard h4 { margin:0 0 2mm; font-size:11pt; color:var(--ink); }
.proposal .paycard .row { display:flex; justify-content:space-between; gap:3mm; font-size:9.5pt; padding:1.1mm 0; border-bottom:1px dashed var(--line); }
.proposal .paycard .row:last-child { border-bottom:none; }
.proposal .paycard .row i { font-style:normal; color:var(--muted); }
.proposal .paycard .row b { direction:ltr; unicode-bidi:isolate; }
.proposal .paycard .qrline { display:flex; gap:4mm; align-items:center; }
.proposal .paycard .qrline .pc-qr { width:26mm; height:26mm; }
@media print {
  .proposal .pcover { margin:0; height:263mm; border-radius:0; }
}
@media screen and (max-width:640px) {
  .proposal { padding:5mm 4mm 10mm; font-size:10pt; }
  .proposal .pcover { height:auto; }
  .proposal .pc-hero { height:72vw; min-height:62mm; }
  .proposal .pc-top { top:5mm; right:5mm; left:5mm; } .proposal .pc-title { right:5mm; left:5mm; bottom:5mm; }
  .proposal .pc-title h1 { font-size:21pt; }
  .proposal .pc-price { flex-direction:column; } .proposal .pc-pp .v { font-size:32pt; }
  .proposal .pc-inc { grid-template-columns:repeat(3,1fr); }
  .proposal .pc-foot { flex-wrap:wrap; } .proposal .pc-trust { width:100%; }
  .proposal .paycard .pb { grid-template-columns:1fr; } .proposal .paycard .pb > div + div { border-inline-start:none; border-top:1px solid var(--line); }
  .proposal .gallery img { height:22vw; }
  .proposal table.grid { font-size:9pt; }
}
@media screen { .proposal .pcover { margin-bottom:12mm; padding-bottom:10mm; border-bottom:1px solid var(--line); border-radius:0; } }
`;

const ICONS: Record<string, ReactNode> = {
  apartment: <path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-5h4v5" />,
  skipass: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h6M7 14h4M16 10v4" /></>,
  transfer: <><rect x="3" y="6" width="18" height="10" rx="2" /><path d="M3 11h18M7 19v-3M17 19v-3" /><circle cx="7.5" cy="13.5" r=".6" /><circle cx="16.5" cy="13.5" r=".6" /></>,
  equipment: <path d="M6 21 18 3M10 21 21 6M4 15l4 2M8 9l4 2" />,
  flight: <path d="M2.5 16.5 21 9l-1-2-7 2-5-5-2 1 3 5.5-4 1.5-2-1.5-1.5.5 2 4z" />,
};
const INC_LABEL: Record<string, string> = { apartment: "דירה", skipass: "סקי פס", transfer: "הסעה מהשדה", equipment: "ציוד סקי", flight: "טיסה ישירה" };
const INC_ORDER = ["apartment", "skipass", "transfer", "equipment", "flight"] as const;

function Ico({ k }: { k: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[k]}</svg>
  );
}

/** a QR code as plain SVG squares (works on the server and in the browser) */
export function Qr({ text, color = "#0B1B33" }: { text: string; color?: string }) {
  let size = 0; let cells: string[] = [];
  try {
    const q = QRCode.create(text, { errorCorrectionLevel: "M" });
    size = q.modules.size;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (q.modules.get(x, y)) cells.push(`M${x} ${y}h1v1h-1z`);
  } catch { cells = []; }
  if (!size) return null;
  return (
    <svg viewBox={`-1 -1 ${size + 2} ${size + 2}`} shapeRendering="crispEdges" role="img" aria-label="QR">
      <rect x="-1" y="-1" width={size + 2} height={size + 2} fill="#fff" />
      <path d={cells.join("")} fill={color} />
    </svg>
  );
}

const allBlocks = (d: ProposalData) => d.sections.flatMap(s => s.blocks);

/** the cover facts: data.hero first, otherwise read from the quote itself */
export function heroOf(d: ProposalData): Required<Pick<ProposalHero, "chips" | "included">> & ProposalHero {
  const h = d.hero ?? {};
  const blocks = allBlocks(d);
  const image = h.image ?? (blocks.find(b => b.type === "gallery") as { urls?: string[] } | undefined)?.urls?.[0];
  const table = blocks.find(b => b.type === "table") as { rows: string[][]; total?: string[] } | undefined;
  const total = h.total ?? (table?.total ? [...table.total].reverse().find(c => /€|₪/.test(c)) : undefined);
  const texts = blocks.map(b => ("text" in b ? String((b as { text: string }).text) : "")).join("\n")
    + "\n" + blocks.filter(b => b.type === "summary").flatMap(b => (b as { rows: string[][] }).rows.map(r => r.join(": "))).join("\n");
  const perPerson = h.perPerson ?? (texts.match(/מחיר לאדם:?\s*(€[\d,]+)/)?.[1]);
  const rowsText = (table?.rows ?? []).map(r => r.join(" ")).join("\n");
  const has = (re: RegExp) => re.test(rowsText);
  const included = h.included ?? INC_ORDER.filter(k => ({
    apartment: has(/לינה|דירה/), skipass: has(/סקי פס/), transfer: has(/הסעה/), equipment: has(/ציוד/), flight: has(/טיס/),
  } as Record<string, boolean>)[k]);
  const chips = h.chips ?? (d.subtitle || "").split(/\s*[|·]\s*/).map(s => s.trim()).filter(Boolean).slice(0, 4);
  const payUrl = h.payUrl ?? (blocks.find(b => b.type === "payment" && (b as { url?: string }).url) as { url?: string } | undefined)?.url;
  return { ...h, image, total, perPerson, included, chips, payUrl };
}

function Cover({ data, link }: { data: ProposalData; link?: string }) {
  const h = heroOf(data);
  const url = link || h.payUrl;
  return (
    <div className="pcover">
      <div className="pc-hero" style={{ backgroundImage: `url("${h.image || "/view.jpg"}")` }}>
        <div className="pc-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="pc-brand"><img src="/skishare-mark-white.png" alt="" />SkiShare</span>
          <span className="pc-tag">הצעת מחיר אישית</span>
        </div>
        <div className="pc-title">
          <div className="pc-kicker">Val Thorens · 2300m · France</div>
          <h1>{data.title}</h1>
          {data.subtitle && <div className="pc-sub">{data.subtitle}</div>}
        </div>
      </div>
      <div className="pc-body">
        {(h.perPerson || h.total) && (
          <div className="pc-price">
            {h.perPerson && (
              <div className="pc-pp">
                <div className="l">המחיר לאדם</div>
                <div className="v">{h.perPerson}</div>
                <div className="s">{h.included.length > 1 ? "כולל " + h.included.map(k => INC_LABEL[k]).join(", ") : "לפי מה שבחרתם"}</div>
              </div>
            )}
            {h.total && (
              <div className="pc-tot">
                <div className="l">סה״כ לכל החבורה</div>
                <div className="v">{h.total}</div>
                <div className="s">{h.guests ? `${h.guests} ${h.guests === 1 ? "אדם" : "אנשים"} · ` : ""}כל אחד יכול לשלם את החלק שלו</div>
              </div>
            )}
          </div>
        )}
        {h.chips.length > 0 && <div className="pc-chips">{h.chips.map((c, i) => <span key={i}>{c}</span>)}</div>}
        <div>
          <p className="pc-h">מה כלול במחיר</p>
          <div className="pc-inc">
            {INC_ORDER.map(k => {
              const on = h.included.includes(k);
              return (
                <div key={k} className={on ? "" : "off"}>
                  <Ico k={k} />{INC_LABEL[k]}
                  <span className="ck">{on ? "כלול" : "לא כלול"}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pc-foot">
          {url && <a className="pc-qr" href={url}><Qr text={url} /></a>}
          <div className="pc-cta">
            <b>{url ? "סורקים או לוחצים, וההצעה פתוחה" : "רוצים לסגור?"}</b>
            <p>{url ? "שם בודקים את הכל, משלמים באתר, וכל אחד מהחבורה יכול לשלם את החלק שלו." : "כתבו לנו בוואטסאפ ונסגור את הכל."}</p>
            {url && <a className="pc-btn" href={url}>לפתוח את ההצעה באתר ←</a>}
            <p className="pc-valid">{h.validUntil ? `ההצעה בתוקף עד ${h.validUntil}, וכפופה לזמינות.` : "ההצעה בתוקף ל-14 ימים, וכפופה לזמינות."}</p>
          </div>
          <div className="pc-trust">
            <span>תשלום מאובטח ב-PayPlus</span>
            <a href="https://wa.me/972555174903">וואטסאפ 055-517-4903</a>
            <a href="https://skisharebook.com">skisharebook.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayCard({ data, link }: { data: ProposalData; link?: string }) {
  const h = heroOf(data);
  const url = link || h.payUrl;
  return (
    <div className="paycard">
      <div className="ph">איך משלמים{h.total && <span>סה״כ {h.total}{h.perPerson ? ` · ${h.perPerson} לאדם` : ""}</span>}</div>
      <div className="pb">
        <div>
          <h4>באתר, בכרטיס אשראי</h4>
          <div className="qrline">
            {url && <a className="pc-qr" href={url}><Qr text={url} /></a>}
            <p className="note" style={{ margin: 0 }}>עד 3 תשלומים בלי ריבית, וכל אחד מהחבורה משלם את החלק שלו בקישור משלו. בכרטיס נוספת עמלת סליקה של 1.9%.</p>
          </div>
          {url && <a className="pc-btn" href={url} style={{ marginTop: "3mm" }}>להזמנה ולתשלום באתר ←</a>}
        </div>
        <div>
          <h4>בהעברה בנקאית, בלי עמלה</h4>
          <div className="row"><i>בנק</i><b>{BANK.name}</b></div>
          <div className="row"><i>סניף · חשבון</i><b>{BANK.branch} · {BANK.account}</b></div>
          <div className="row"><i>IBAN</i><b>{BANK.iban}</b></div>
          <div className="row"><i>SWIFT</i><b>{BANK.swift}</b></div>
          <div className="row"><i>שם המוטב</i><b>{BANK.holder}</b></div>
        </div>
      </div>
    </div>
  );
}

/** link: the quote on the website (QR code and buttons); otherwise data.hero.payUrl or the first payment link */
export default function ProposalDocument({ data, link }: { data: ProposalData; link?: string }) {
  // terms (cancellation / validity / payment / flights / site terms / approval) always appear
  const sections = withMandatoryTerms(data.sections);
  const termsAt = sections.findIndex(s => s.heading === "תנאים");
  return (
    <div className="proposal" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: COVER_CSS }} />
      <Cover data={data} link={link} />

      {data.intro && <div className="intro">{data.intro}</div>}

      {sections.map((sec, si) => (
        <section key={si}>
          {si === termsAt && <PayCard data={data} link={link} />}
          <h2><span className="num">{si + 1}</span>{sec.heading}</h2>
          {sec.blocks.map((b, bi) => <Block key={bi} block={b} />)}
        </section>
      ))}

      {data.signature && (
        <div className="sign">
          <h3>{data.signature.heading}</h3>
          <p>{data.signature.text}</p>
          <div className="sign-grid">
            {data.signature.fields.map((f, i) => (
              <div key={i}>
                <div className="line" />
                <div className="cap">{f}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="doc-foot">
        <span>SkiShare · {BANK.holder} · חופשות סקי בואל טורנס</span>
        <span>skisharebook.com</span>
      </div>
    </div>
  );
}
