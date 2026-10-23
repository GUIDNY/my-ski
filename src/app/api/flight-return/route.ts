import { NextRequest, NextResponse } from "next/server";
import { buildGoogleFlightsUrl, buildGoogleFlightsOneWayUrl } from "@/lib/google-flights";
import { resultRows, cheapest, pickReturn, type ResultRow } from "@/lib/google-flights-parse";
import puppeteer, { type ElementHandle, type Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
export const maxDuration = 60;

// Both legs of the cheapest nonstop round trip, for the quote PDF.
//
// /api/flight-price only reads Google Flights' first page (the outbound
// flights, each with its round-trip total), so it never sees the return
// flight and the quote PDF had no times for it. This route opens the same
// nonstop round-trip search, clicks the cheapest outbound result to reach
// the "returning flights" list, and reads the return there: that is the
// flight behind the round-trip price. If the click path doesn't produce
// return rows, it falls back to a one-way nonstop search on the return date,
// preferring the outbound's airline.
//
// The quote bot calls it once per quote, and the apartment page once a
// direct flight is added (for the return times). A found result is kept at
// the edge for a few hours, like /api/flight-price's cache, so the same dates
// don't start a new browser every time; failures are never kept.

function isValidAirport(code: string) {
  return /^[A-Z]{3}$/.test(code);
}
function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const bodyLines = async (page: Page) => (await page.evaluate(() => document.body.innerText)).split("\n").map(l => l.trim());

// Same wait as /api/flight-price: poll for Google's "N results returned" /
// "No results returned" marker instead of a fixed delay, reloading once on
// the transient "Oops, something went wrong" page.
async function waitForResults(page: Page): Promise<string> {
  let reloaded = false;
  for (let i = 0; i < 8; i++) {
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (/\d+\s+results?\s+returned|No results returned/i.test(bodyText)) return bodyText;
    if (!reloaded && /Oops, something went wrong/i.test(bodyText)) {
      reloaded = true;
      await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    }
    await sleep(1500);
  }
  return await page.evaluate(() => document.body.innerText);
}

// Click the result row that shows this price and departure time: the
// smallest element holding both, i.e. the row itself, not the whole list.
async function clickRow(page: Page, priceLine: string, departTime: string): Promise<boolean> {
  const handle = await page.evaluateHandle((price: string, depart: string) => {
    let best: HTMLElement | null = null;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("li, [role='listitem'], [role='link'], [role='button'], div[jsaction]"))) {
      const t = el.innerText || "";
      if (!t.includes(price) || !t.includes(depart)) continue;
      if (!best || t.length < (best.innerText || "").length) best = el;
    }
    return best;
  }, priceLine, departTime);
  const el = handle.asElement() as ElementHandle<Element> | null;
  if (!el) return false;
  await el.click();
  return true;
}

type Leg = { departTime: string; arriveTime: string; airline: string | null };
const leg = (r: ResultRow): Leg => ({ departTime: r.departTime, arriveTime: r.arriveTime, airline: r.airline });

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const origin = (sp.get("origin") || "TLV").toUpperCase();
  const dest = (sp.get("dest") || "LYS").toUpperCase();
  const checkin = sp.get("checkin") || "";
  const checkout = sp.get("checkout") || "";
  // Page text dump for checking the parser against Google's real layout.
  // Never on production.
  const debug = sp.get("debug") === "1" && process.env.VERCEL_ENV !== "production";

  if (!isValidAirport(origin) || !isValidAirport(dest) || !isValidDate(checkin) || !isValidDate(checkout)) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 });
  }

  const pages: Record<string, string[]> = {};
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: "shell" });
    const page = await browser.newPage();

    // 1. Outbound: the cheapest nonstop round trip, as /api/flight-price reads it.
    const url = buildGoogleFlightsUrl(checkin, checkout, origin, dest, true);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForResults(page);
    const outLines = await bodyLines(page);
    if (debug) pages.outbound = outLines.slice(0, 250);
    const out = cheapest(resultRows(outLines, origin, dest));
    if (!out) return NextResponse.json({ ok: false, nonstop: false, url, ...(debug ? { pages } : {}) });

    // 2. Return: click that outbound result and read the "returning flights" list.
    let ret: ResultRow | null = null;
    let source: "click" | "oneway" | null = null;
    try {
      if (await clickRow(page, outLines[out.idx], out.departTime)) {
        for (let i = 0; i < 10 && !ret; i++) {
          await sleep(1200);
          const lines = await bodyLines(page);
          const rows = resultRows(lines, dest, origin);
          if (rows.length) {
            ret = pickReturn(rows, out.airline);
            source = "click";
            if (debug) pages.returnClick = lines.slice(0, 250);
          } else if (debug && i === 9) pages.returnClick = lines.slice(0, 250);
        }
      }
    } catch (e) {
      console.error("flight-return click path failed", e);
    }

    // 3. Fallback: a one-way nonstop search for the return date.
    if (!ret) {
      const owUrl = buildGoogleFlightsOneWayUrl(checkout, dest, origin, true);
      await page.goto(owUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await waitForResults(page);
      const lines = await bodyLines(page);
      if (debug) pages.returnOneWay = lines.slice(0, 250);
      ret = pickReturn(resultRows(lines, dest, origin), out.airline);
      if (ret) source = "oneway";
    }

    return NextResponse.json({
      ok: true, nonstop: true, price: out.price, url,
      outbound: leg(out),
      return: ret ? leg(ret) : null,
      source,
      checkedAt: new Date().toISOString(),
      ...(debug ? { pages } : {}),
    }, debug || !ret ? undefined : { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600" } });
  } catch (e) {
    console.error("flight-return scrape failed", e);
    return NextResponse.json({ ok: false, error: "לא הצלחנו לבדוק את הטיסות כרגע", ...(debug ? { pages } : {}) }, { status: 200 });
  } finally {
    await browser?.close();
  }
}
