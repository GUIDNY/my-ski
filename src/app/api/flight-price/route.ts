import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { buildGoogleFlightsUrl } from "@/lib/google-flights";
import puppeteer, { type Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
export const maxDuration = 60;

const CACHE_HOURS = 6;
// What the customer sees = the real scraped price + our handling margin.
// The cache keeps the RAW price; the margin is added on every answer, so
// every surface (site booking, bots, quote engine) shows the same number.
const FLIGHT_MARGIN_EUR = 25;
const sell = (p: number | null) => (p === null || p === undefined ? null : Number(p) + FLIGHT_MARGIN_EUR);

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
// (Oct 2026: Google no longer always renders the "N results returned"
// marker, so a priced "round trip" row seen on two polls in a row counts as
// loaded too.)
async function waitForResults(page: Page): Promise<string> {
  let reloaded = false;
  let sawRow = false;
  for (let i = 0; i < 10; i++) {
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (/\d+\s+results?\s+returned|No results returned/i.test(bodyText)) return bodyText;
    if (/\nround trip\n/.test(bodyText)) { if (sawRow) return bodyText; sawRow = true; }
    if (!reloaded && /Oops, something went wrong/i.test(bodyText)) {
      reloaded = true;
      await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 });
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return await page.evaluate(() => document.body.innerText);
}

/** if Google still shows its consent page, press "Reject all" (or "Accept all") and go back to the search */
async function passConsent(page: Page, url: string) {
  if (!/consent\.google/.test(page.url())) return;
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find(x => /reject all|accept all/i.test(x.textContent ?? ""));
    b?.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  if (!page.url().includes("/travel/flights")) await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
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
    // The server runs in Europe, where Google first shows a cookie-consent
    // page instead of the flights: caught live (TLV-LYS 27.2.2027, a direct
    // Transavia flight read as "no flight"). The consent cookie skips it.
    await page.setCookie(
      { name: "SOCS", value: "CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg", domain: ".google.com", path: "/" },
      { name: "CONSENT", value: "YES+cb", domain: ".google.com", path: "/" },
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    const nonstopUrl = buildGoogleFlightsUrl(outDate, retDate, origin, dest, true);
    await page.goto(nonstopUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await passConsent(page, nonstopUrl);
    let bodyText = await waitForResults(page);

    if (!/No results returned/i.test(bodyText)) {
      const lines = bodyText.split("\n").map(l => l.trim());
      const result = cheapestRoundTripResult(lines);
      if (result) return { price: result.price, nonstop: true, url: nonstopUrl, ...flightDetailsForResult(lines, result.idx) };
    }

    // No nonstop option this date — fall back to the plain (any-stops) search.
    const anyUrl = buildGoogleFlightsUrl(outDate, retDate, origin, dest, false);
    await page.goto(anyUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await passConsent(page, anyUrl);
    bodyText = await waitForResults(page);
    if (!/\nround trip\n/.test(bodyText)) console.warn("flight-price: no results read", page.url().slice(0, 80), bodyText.slice(0, 200).replace(/\n/g, " | "));
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

  // a direct flight is shown with its times: a cached row without them (the
  // table in production has no detail columns yet) is checked again
  // and an empty answer (no price at all) means the read failed, not "no flights"
  const complete = cached && cached.price_eur !== null && (!cached.nonstop || cached.depart_time);
  if (cached && complete && Date.now() - new Date(cached.checked_at).getTime() < CACHE_HOURS * 3600_000) {
    return NextResponse.json({
      price: sell(cached.price_eur), nonstop: cached.nonstop, url: cached.url,
      airline: cached.airline ?? null, departTime: cached.depart_time ?? null, arriveTime: cached.arrive_time ?? null,
      checkedAt: cached.checked_at, cached: true,
    });
  }

  try {
    const { price, nonstop, url, airline, departTime, arriveTime } = await scrapePrice(checkin, checkout, origin, dest);
    const checkedAt = new Date().toISOString();
    // Caching is best-effort — a schema mismatch (e.g. a new column not
    // existing yet) must never take down the live price response below.
    // (supabase returns the error instead of throwing: a table without the
    // newer columns used to fail silently, so nothing was ever cached; then
    // the base columns are written, which the quote PDF reads)
    if (price !== null) try {
      const row = { origin, dest, checkin, checkout, price_eur: price, nonstop, checked_at: checkedAt };
      const { error: fullErr } = await db.from("flight_price_cache")
        .upsert({ ...row, url, airline, depart_time: departTime, arrive_time: arriveTime }, { onConflict: "origin,dest,checkin,checkout" });
      if (fullErr) {
        // expected until the table gets the columns url, airline, depart_time, arrive_time
        console.warn("flight-price cache: writing the base columns only:", fullErr.message);
        const { error: baseErr } = await db.from("flight_price_cache").upsert(row, { onConflict: "origin,dest,checkin,checkout" });
        if (baseErr) console.error("flight-price cache write failed:", baseErr.message);
      }
    } catch (cacheErr) {
      console.error("flight-price cache write failed", cacheErr);
    }
    // a direct flight found: the CDN keeps this answer for 6 hours (per dates and airport),
    // so the next visitor gets it at once; a "no direct flight" isn't kept (the search can miss one)
    return NextResponse.json({ price: sell(price), nonstop, url, airline, departTime, arriveTime, checkedAt, cached: false },
      nonstop ? { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600" } } : undefined);
  } catch (e) {
    console.error("flight-price scrape failed", e);
    // Serve stale cache rather than nothing, if we have any at all.
    if (cached) {
      return NextResponse.json({
        price: sell(cached.price_eur), nonstop: cached.nonstop, url: cached.url,
        airline: cached.airline ?? null, departTime: cached.depart_time ?? null, arriveTime: cached.arrive_time ?? null,
        checkedAt: cached.checked_at, cached: true, stale: true,
      });
    }
    return NextResponse.json({ price: null, error: "לא הצלחנו לבדוק מחיר טיסה כרגע" }, { status: 200 });
  }
}
