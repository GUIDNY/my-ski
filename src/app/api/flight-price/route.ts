import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { buildGoogleFlightsUrl } from "@/lib/google-flights";
import puppeteer from "puppeteer-core";
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

// Every result row renders as "<depart time>\n–\n<arrive time>\n<airline>\n
// <duration>\n...\n€<price>\nround trip" (verified against real nonstop AND
// connecting results, including multi-leg codeshares like "ITA, Lufthansa").
// Walking back from the matched price line to the nearest preceding
// time-dash-time triple and reading the line right after it is more
// robust than counting a fixed number of lines back, since the block
// between airline and price varies in length (an extra layover line for
// connections, an emissions-delta line that isn't always present).
function airlineForResult(lines: string[], priceIdx: number): string | null {
  const timeRe = /^\d{1,2}:\d{2}\s?(AM|PM)(\+\d)?$/i;
  for (let j = priceIdx - 1; j >= 1; j--) {
    if (lines[j].length <= 3 && timeRe.test(lines[j - 1]) && timeRe.test(lines[j + 1])) {
      return lines[j + 2]?.trim() || null;
    }
  }
  return null;
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
async function scrapePrice(outDate: string, retDate: string, origin: string, dest: string): Promise<{ price: number | null; nonstop: boolean; url: string; airline: string | null }> {
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
    await new Promise(r => setTimeout(r, 4500));
    let bodyText = await page.evaluate(() => document.body.innerText);

    if (!/No results returned/i.test(bodyText)) {
      const lines = bodyText.split("\n").map(l => l.trim());
      const result = cheapestRoundTripResult(lines);
      if (result) return { price: result.price, nonstop: true, url: nonstopUrl, airline: airlineForResult(lines, result.idx) };
    }

    // No nonstop option this date — fall back to the plain (any-stops) search.
    const anyUrl = buildGoogleFlightsUrl(outDate, retDate, origin, dest, false);
    await page.goto(anyUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await new Promise(r => setTimeout(r, 4500));
    bodyText = await page.evaluate(() => document.body.innerText);
    const lines = bodyText.split("\n").map(l => l.trim());
    const result = cheapestRoundTripResult(lines);
    return { price: result?.price ?? null, nonstop: false, url: anyUrl, airline: result ? airlineForResult(lines, result.idx) : null };
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
    return NextResponse.json({ price: cached.price_eur, nonstop: cached.nonstop, url: cached.url, airline: cached.airline ?? null, checkedAt: cached.checked_at, cached: true });
  }

  try {
    const { price, nonstop, url, airline } = await scrapePrice(checkin, checkout, origin, dest);
    const checkedAt = new Date().toISOString();
    // Caching is best-effort — a schema mismatch (e.g. the airline column
    // not existing yet) must never take down the live price response below.
    try {
      await db.from("flight_price_cache")
        .upsert({ origin, dest, checkin, checkout, price_eur: price, nonstop, url, airline, checked_at: checkedAt }, { onConflict: "origin,dest,checkin,checkout" });
    } catch (cacheErr) {
      console.error("flight-price cache write failed", cacheErr);
    }
    return NextResponse.json({ price, nonstop, url, airline, checkedAt, cached: false });
  } catch (e) {
    console.error("flight-price scrape failed", e);
    // Serve stale cache rather than nothing, if we have any at all.
    if (cached) {
      return NextResponse.json({ price: cached.price_eur, nonstop: cached.nonstop, url: cached.url, airline: cached.airline ?? null, checkedAt: cached.checked_at, cached: true, stale: true });
    }
    return NextResponse.json({ price: null, error: "לא הצלחנו לבדוק מחיר טיסה כרגע" }, { status: 200 });
  }
}
