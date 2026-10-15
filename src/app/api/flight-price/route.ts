import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { buildGoogleFlightsUrl } from "@/lib/google-flights";
import puppeteer, { type Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
export const maxDuration = 60;

const CACHE_HOURS = 6;

function isValidAirport(code: string) {
  return /^[A-Z]{3}$/.test(code);
}
function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Cheapest "€X\nround trip" pair in the rendered results — a bare price
// line is only a genuine result if the very next line is exactly "round
// trip"; that excludes both the "Cheapest from €X" tab label and the
// persistent "Track prices" toast ("Travel Dec 1 – 8 for €230"), which
// both also end in a €amount but aren't followed by "round trip". Returns
// the matched line's index too, so the caller can walk back from it to
// find which result row this price belongs to (for airline extraction).
function cheapestRoundTripResult(lines: string[]): { price: number; idx: number } | null {
  let best: { price: number; idx: number } | null = null;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i + 1] !== "round trip") continue;
    const priceMatch = lines[i].match(/^€\s?([\d,]+)$/);
    if (!priceMatch) continue;
    const price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
    if (!Number.isFinite(price)) continue;
    if (!best || price < best.price) best = { price, idx: i };
  }
  return best;
}

// Puppeteer's default viewport (800×600, what the production scraper
// actually runs at — confirmed the hard way: a first version of this tuned
// against a wider local-browser capture mis-read "LYS" the *airport code*
// as the airline name in production) renders Google Flights' compact
// layout, where every result row is a fixed sequence with NO separator
// lines at all:
//   <depart time>
//   <origin code, 3 letters>
//   <arrive time>
//   <dest code, 3 letters>
//   €<price>
//   round trip
//   <"Nonstop"|"N stop(s)"><duration><airline(s), concatenated, no space>
//   [emissions line]
// Verified against real nonstop AND connecting results (13-result list,
// multi-leg codeshares like "ITA, Lufthansa") captured at this exact
// viewport — both the pre-price time/code block and the post-price
// stops+duration+airline line hold for every row, regardless of how many
// stops or whether an emissions line follows.
const TIME_RE = /^\d{1,2}:\d{2}\s?(AM|PM)(\+\d)?$/i;
const AIRPORT_RE = /^[A-Z]{3}$/;

function flightDetailsForResult(lines: string[], priceIdx: number): { departTime: string | null; arriveTime: string | null; airline: string | null } {
  const departTime = TIME_RE.test(lines[priceIdx - 4] ?? "") ? lines[priceIdx - 4] : null;
  const arriveTime = TIME_RE.test(lines[priceIdx - 2] ?? "") ? lines[priceIdx - 2] : null;
  const originOk = AIRPORT_RE.test(lines[priceIdx - 3] ?? "");
  const destOk = AIRPORT_RE.test(lines[priceIdx - 1] ?? "");

  const infoLine = lines[priceIdx + 2] ?? "";
  const airline = infoLine
    .replace(/^(?:Nonstop|\d+\s*stops?)/i, "")
    .replace(/^\s*\d+\s*hr(?:\s*\d+\s*min)?/i, "")
    .trim() || null;

  return {
    departTime: originOk && departTime ? departTime : null,
    arriveTime: destOk && arriveTime ? arriveTime : null,
    airline,
  };
}

// Previously tried to infer "is this result nonstop?" by checking nearby
// text for the word "Nonstop" — that heuristic proved unreliable (verified
// wrong on a real case: a genuine cheapest-nonstop flight got tagged as a
// connecting one). Far more robust: ask Google Flights to filter to
// nonstop-only directly (the same `28 00`-per-leg URL bytes the real
// "Nonstop" filter button produces) and read whatever's cheapest THERE —
// no adjacency guessing, since every result on that page is nonstop by
// definition. Only fall back to an unfiltered scrape when the nonstop
// query itself returns nothing.
type ScrapeResult = { price: number | null; nonstop: boolean; url: string; airline: string | null; departTime: string | null; arriveTime: string | null };

// A fixed 4.5s wait proved unreliable in production: caught live with real
// data (TLV-LYS, 2027-02-13) — a genuine nonstop existed (confirmed by
// reloading the exact same nonstop-filtered URL moments later: "1 result
// returned", Transavia, €214) but the first read landed while the page
// still said "Loading results", found no price line, and silently fell
// through to the any-stops search, wrongly reporting nonstop:false. Poll
// instead for the actual "N result(s) returned" / "No results returned"
// marker Google Flights renders once search finishes, and reload once if a
// transient "Oops, something went wrong" interstitial shows up (also seen
// live, unrelated to this date actually having no nonstop option).
async function waitForResults(page: Page): Promise<string> {
  let reloaded = false;
  for (let i = 0; i < 7; i++) {
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (/\d+\s+results?\s+returned|No results returned/i.test(bodyText)) return bodyText;
    if (!reloaded && /Oops, something went wrong/i.test(bodyText)) {
      reloaded = true;
      await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return await page.evaluate(() => document.body.innerText);
}

async function scrapePrice(outDate: string, retDate: string, origin: string, dest: string): Promise<ScrapeResult> {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
    const page = await browser.newPage();

    const nonstopUrl = buildGoogleFlightsUrl(outDate, retDate, origin, dest, true);
    await page.goto(nonstopUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    let bodyText = await waitForResults(page);

    if (!/No results returned/i.test(bodyText)) {
      const lines = bodyText.split("\n").map(l => l.trim());
      const result = cheapestRoundTripResult(lines);
      if (result) return { price: result.price, nonstop: true, url: nonstopUrl, ...flightDetailsForResult(lines, result.idx) };
    }

    // No nonstop option this date — fall back to the plain (any-stops) search.
    const anyUrl = buildGoogleFlightsUrl(outDate, retDate, origin, dest, false);
    await page.goto(anyUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    bodyText = await waitForResults(page);
    const lines = bodyText.split("\n").map(l => l.trim());
    const result = cheapestRoundTripResult(lines);
    const details = result ? flightDetailsForResult(lines, result.idx) : { airline: null, departTime: null, arriveTime: null };
    return { price: result?.price ?? null, nonstop: false, url: anyUrl, ...details };
  } finally {
    await browser?.close();
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const origin = (sp.get("origin") || "TLV").toUpperCase();
  const dest = (sp.get("dest") || "LYS").toUpperCase();
  const checkin = sp.get("checkin") || "";
  const checkout = sp.get("checkout") || "";

  if (!isValidAirport(origin) || !isValidAirport(dest) || !isValidDate(checkin) || !isValidDate(checkout)) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 });
  }

  const db = createServerClient();
  const { data: cached } = await db.from("flight_price_cache")
    .select("*").eq("origin", origin).eq("dest", dest).eq("checkin", checkin).eq("checkout", checkout).maybeSingle();

  if (cached && Date.now() - new Date(cached.checked_at).getTime() < CACHE_HOURS * 3600_000) {
    return NextResponse.json({
      price: cached.price_eur, nonstop: cached.nonstop, url: cached.url,
      airline: cached.airline ?? null, departTime: cached.depart_time ?? null, arriveTime: cached.arrive_time ?? null,
      checkedAt: cached.checked_at, cached: true,
    });
  }

  try {
    const { price, nonstop, url, airline, departTime, arriveTime } = await scrapePrice(checkin, checkout, origin, dest);
    const checkedAt = new Date().toISOString();
    // Caching is best-effort — a schema mismatch (e.g. a new column not
    // existing yet) must never take down the live price response below.
    try {
      await db.from("flight_price_cache")
        .upsert({ origin, dest, checkin, checkout, price_eur: price, nonstop, url, airline, depart_time: departTime, arrive_time: arriveTime, checked_at: checkedAt }, { onConflict: "origin,dest,checkin,checkout" });
    } catch (cacheErr) {
      console.error("flight-price cache write failed", cacheErr);
    }
    return NextResponse.json({ price, nonstop, url, airline, departTime, arriveTime, checkedAt, cached: false });
  } catch (e) {
    console.error("flight-price scrape failed", e);
    // Serve stale cache rather than nothing, if we have any at all.
    if (cached) {
      return NextResponse.json({
        price: cached.price_eur, nonstop: cached.nonstop, url: cached.url,
        airline: cached.airline ?? null, departTime: cached.depart_time ?? null, arriveTime: cached.arrive_time ?? null,
        checkedAt: cached.checked_at, cached: true, stale: true,
      });
    }
    return NextResponse.json({ price: null, error: "לא הצלחנו לבדוק מחיר טיסה כרגע" }, { status: 200 });
  }
}
