import Link from "next/link";
import type { ReactNode } from "react";

/*
 * The small markup the guide texts use (lib/guides.ts):
 *   [text](/path)  a link: next/link to our own pages, a plain <a> to other sites
 *   **text**       bold
 * Numbers with a range or a sum in them ("21.11–18.12.2026", "€810–€930",
 * "2 × €421 = €842") are kept left to right: in Hebrew text the two sides of
 * the dash would otherwise swap places.
 */

const MARKUP = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*/g;
const NUM = String.raw`€?\d(?:[\d.,:]*\d)?%?`;
const NUM_RUN = new RegExp(`${NUM}(?:\\s*[–\\-×+=]\\s*${NUM})+`, "g");

export const linkClass = "font-bold text-accent hover:text-accent-hover";

function keepNumbers(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0, n = 0;
  for (const m of text.matchAll(NUM_RUN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    // a short run ("5–17", "€810–€930") never breaks; a long one may wrap after its dash in a narrow table cell
    out.push(<bdi key={`${key}.${n++}`} dir="ltr" className={m[0].length <= 9 ? "whitespace-nowrap" : undefined}>{m[0]}</bdi>);
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0, n = 0;
  for (const m of text.matchAll(MARKUP)) {
    const at = m.index ?? 0;
    const key = `m${n++}`;
    if (at > last) out.push(...keepNumbers(text.slice(last, at), `${key}t`));
    const [, label, href, bold] = m;
    if (bold !== undefined) {
      out.push(<strong key={key} className="font-bold text-ink">{keepNumbers(bold, key)}</strong>);
    } else if (href.startsWith("/")) {
      // Hebrew addresses percent-encoded, as Google recommends for links
      out.push(<Link key={key} href={encodeURI(href)} className={linkClass}>{keepNumbers(label, key)}</Link>);
    } else {
      out.push(<a key={key} href={href} rel="noopener" className={linkClass}>{keepNumbers(label, key)}</a>);
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(...keepNumbers(text.slice(last), `m${n}t`));
  return <>{out}</>;
}
