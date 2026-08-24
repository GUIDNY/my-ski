import type { ProposalData, ProposalBlock } from "@/types";
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
:root { --ink:#1c2126; --muted:#5a636d; --box:#f4f6f8; --line:#e4e8ec; --line2:#d8dde2; }

/* screen: show a centred A4 sheet */
.proposal-screen { background:#e9edf1; padding:24px 12px; min-height:100vh; }
.proposal {
  direction:rtl; color:var(--ink); font-size:10.5pt; line-height:1.75;
  font-family:"Segoe UI","Arial","Helvetica Neue",sans-serif;
  background:#fff; width:210mm; max-width:100%; margin:0 auto;
  padding:18mm 16mm 20mm; box-shadow:0 6px 30px rgba(2,6,23,0.18); border-radius:2px;
}
.proposal * { box-sizing:border-box; }
.proposal .cover { text-align:center; padding-top:6mm; }
.proposal .cover img { width:46mm; max-width:60%; }
.proposal h1 { font-size:20pt; margin:4mm 0 1mm; letter-spacing:-0.4px; font-weight:800; }
.proposal .sub { font-size:11pt; color:var(--muted); margin-bottom:5mm; }
.proposal .rule { height:2.5px; background:var(--ink); width:30mm; margin:0 auto 7mm; }
.proposal .intro { background:var(--box); border-right:3px solid var(--ink); padding:4mm 5mm; margin-bottom:8mm; text-align:justify; }
.proposal h2 { font-size:12.5pt; margin:7mm 0 3mm; padding-bottom:1.5mm; border-bottom:1px solid var(--line2); font-weight:700; }
.proposal h2 .num { display:inline-block; background:var(--ink); color:#fff; width:7mm; height:7mm; line-height:7mm; text-align:center; border-radius:50%; font-size:9pt; margin-left:3mm; }
.proposal p { margin:0 0 2.5mm; text-align:justify; }
.proposal ul { margin:0 0 3mm; padding-right:5mm; }
.proposal ul li { margin-bottom:1mm; }
.proposal .route { background:var(--ink); color:#fff; padding:2.5mm 4mm; font-weight:bold; font-size:10.5pt; margin-bottom:2mm; }
.proposal table.flt { width:100%; border-collapse:collapse; margin-bottom:4mm; font-size:10pt; }
.proposal table.flt td { padding:1.8mm 3mm; border-bottom:1px solid var(--line); }
.proposal table.flt td.k { color:var(--muted); width:38%; }
.proposal table.flt td.v { font-weight:bold; }
.proposal .opt { border:1px solid var(--line2); border-radius:2mm; padding:3mm 4mm; margin-bottom:3mm; }
.proposal .opt .lbl { font-weight:bold; display:block; margin-bottom:1mm; }
.proposal table.sum { width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:4mm; }
.proposal table.sum tr:nth-child(odd) { background:var(--box); }
.proposal table.sum td { padding:2.2mm 4mm; }
.proposal table.sum td.k { color:var(--muted); width:32%; }
.proposal table.sum td.v { font-weight:bold; }
.proposal table.grid { width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:4mm; }
.proposal table.grid th { background:var(--ink); color:#fff; padding:2.2mm 3mm; text-align:right; font-size:9.5pt; }
.proposal table.grid td { padding:2.2mm 3mm; border-bottom:1px solid var(--line); }
.proposal table.grid tr.total td { font-weight:bold; border-top:2px solid var(--ink); border-bottom:none; background:var(--box); }
.proposal .sign { margin-top:8mm; border:1.5px solid var(--ink); padding:5mm; page-break-inside:avoid; }
.proposal .sign h3 { font-size:11.5pt; margin:0 0 2mm; font-weight:700; }
.proposal .sign-grid { display:grid; grid-template-columns:1fr 1fr; gap:6mm 10mm; margin-top:6mm; }
.proposal .line { border-bottom:1px solid var(--ink); height:8mm; margin-bottom:1.5mm; }
.proposal .cap { font-size:8.5pt; color:var(--muted); }
.proposal .note { font-size:9.5pt; color:var(--muted); }
.proposal section { page-break-inside:avoid; }

@media print {
  @page { size:A4; margin:18mm 16mm 20mm 16mm;
    @bottom-center { content:"SkiShare  |  עמוד " counter(page) " מתוך " counter(pages); font-size:8pt; color:#8a9099; } }
  html, body { background:#fff !important; }
  .proposal-screen { background:#fff !important; padding:0 !important; }
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
    default:
      return null;
  }
}

export default function ProposalDocument({ data }: { data: ProposalData }) {
  // terms (cancellation / validity / payment / flights / site terms / approval) always appear
  const sections = withMandatoryTerms(data.sections);
  return (
    <div className="proposal" dir="rtl">
      <div className="cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/skishare-logo.png" alt="SkiShare" />
        <h1>{data.title}</h1>
        {data.subtitle && <div className="sub">{data.subtitle}</div>}
        <div className="rule" />
      </div>

      {data.intro && <div className="intro">{data.intro}</div>}

      {sections.map((sec, si) => (
        <section key={si}>
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
    </div>
  );
}
