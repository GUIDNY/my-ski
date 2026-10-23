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
.proposal section { page-break-inside:avoid; }
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

export default function ProposalDocument({ data }: { data: ProposalData }) {
  // terms (cancellation / validity / payment / flights / site terms / approval) always appear
  const sections = withMandatoryTerms(data.sections);
  return (
    <div className="proposal" dir="rtl">
      <div className="cover">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/skishare-mark.png" alt="" />
          <span>SkiShare</span>
          <span className="tag">הצעת מחיר אישית</span>
        </div>
        <h1>{data.title}</h1>
        {data.subtitle && <div className="sub">{data.subtitle}</div>}
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

      <div className="doc-foot">
        <span>SkiShare · סקי שר בע״מ · חופשות סקי בואל טורנס</span>
        <span>skisharebook.com</span>
      </div>
    </div>
  );
}
