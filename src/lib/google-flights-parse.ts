// Text parsing of a Google Flights results page, as rendered at Puppeteer's
// default 800×600 viewport (the compact layout — see the long comment in
// /api/flight-price for how it was verified). Every result row there is:
//   <depart time>
//   <origin code>
//   <arrive time>
//   <dest code>
//   €<price>
//   ["round trip" | "one way"]
//   <"Nonstop"|"N stop(s)"><duration><airline(s)>
// Kept free of Puppeteer so it can be unit-tested on captured page text.

export const TIME_RE = /^\d{1,2}:\d{2}\s?(AM|PM)(\+\d)?$/i;
const PRICE_RE = /^€\s?([\d,]+)$/;
const STOPS_RE = /^(?:Nonstop|\d+\s*stops?)/i;

export type ResultRow = {
  price: number;
  departTime: string;
  arriveTime: string;
  airline: string | null;
  nonstop: boolean;
  // index of the €price line in `lines`
  idx: number;
};

// "Nonstop4 hr 5 minTransavia" → "Transavia" ("50 min" alone is a duration too).
export function airlineFromInfo(info: string): string | null {
  const s = info
    .replace(STOPS_RE, "")
    .replace(/^\s*\d+\s*hr(?:\s*\d+\s*min)?/i, "")
    .replace(/^\s*\d+\s*min/i, "")
    .trim();
  return s || null;
}

// All result rows that fly `from` → `to`. Rows of the other direction (for
// example the already-selected outbound flight shown at the top of the
// "returning flights" page) and stray price lines (the "Cheapest from €X"
// tab, the price-tracking toast) never match the time/code/time/code block.
export function resultRows(lines: string[], from: string, to: string): ResultRow[] {
  const rows: ResultRow[] = [];
  for (let i = 4; i < lines.length; i++) {
    const m = lines[i].match(PRICE_RE);
    if (!m) continue;
    const [departTime, o, arriveTime, d] = [lines[i - 4], lines[i - 3], lines[i - 2], lines[i - 1]];
    if (!TIME_RE.test(departTime) || !TIME_RE.test(arriveTime) || o !== from || d !== to) continue;
    let info = "";
    for (let j = i + 1; j <= i + 3 && j < lines.length; j++) {
      if (STOPS_RE.test(lines[j])) { info = lines[j]; break; }
    }
    const price = parseInt(m[1].replace(/,/g, ""), 10);
    if (!Number.isFinite(price)) continue;
    rows.push({ price, departTime, arriveTime, airline: info ? airlineFromInfo(info) : null, nonstop: /^Nonstop/i.test(info), idx: i });
  }
  return rows;
}

export function cheapest(rows: ResultRow[]): ResultRow | null {
  return rows.reduce<ResultRow | null>((best, r) => (!best || r.price < best.price ? r : best), null);
}

// Pick the return flight to show: same airline as the outbound if there is
// one (that is almost always the flight behind the round-trip price), else
// the cheapest.
export function pickReturn(rows: ResultRow[], outboundAirline: string | null): ResultRow | null {
  const a = (outboundAirline || "").toLowerCase();
  const same = a ? rows.filter(r => (r.airline || "").toLowerCase().includes(a) || a.includes((r.airline || "").toLowerCase() || "\u0000")) : [];
  return cheapest(same.length ? same : rows);
}
