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

async function scrapePrice(outDate: string, retDate: string, origin: string, dest: string): Promise<{ price: number | null; nonstop: boolean }> {
  const url = buildGoogleFlightsUrl(outDate, retDate, origin, dest);
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    // Google Flights renders results client-side after load; give it a beat.
    await new Promise(r => setTimeout(r, 4500));
    const bodyText = await page.evaluate(() => document.body.innerText);

    // Each real flight-result card renders as a run of lines ending in
    // "...<stops line>...€<price>\nround trip" — a bare price line is only
    // a genuine result if the very next line is exactly "round trip"; that
    // excludes both the "Cheapest from €X" tab label and the persistent
    // "Track prices" toast ("Travel Dec 1 – 8 for €230"), which both also
    // end in a €amount but aren't followed by "round trip".
    const lines = bodyText.split("\n").map(l => l.trim());
    let best: { price: number; nonstop: boolean } | null = null;
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i + 1] !== "round trip") continue;
      const priceMatch = lines[i].match(/^€\s?([\d,]+)$/);
      if (!priceMatch) continue;
      const price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
      if (!Number.isFinite(price)) continue;
      const context = lines.slice(Math.max(0, i - 6), i).join(" ");
      const nonstop = /Nonstop/i.test(context);
      if (!best || price < best.price) best = { price, nonstop };
    }
    return best ? { price: best.price, nonstop: best.nonstop } : { price: null, nonstop: false };
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
    return NextResponse.json({ price: cached.price_eur, nonstop: cached.nonstop, checkedAt: cached.checked_at, cached: true });
  }

  try {
    const { price, nonstop } = await scrapePrice(checkin, checkout, origin, dest);
    const checkedAt = new Date().toISOString();
    await db.from("flight_price_cache")
      .upsert({ origin, dest, checkin, checkout, price_eur: price, nonstop, checked_at: checkedAt }, { onConflict: "origin,dest,checkin,checkout" });
    return NextResponse.json({ price, nonstop, checkedAt, cached: false });
  } catch (e) {
    console.error("flight-price scrape failed", e);
    // Serve stale cache rather than nothing, if we have any at all.
    if (cached) {
      return NextResponse.json({ price: cached.price_eur, nonstop: cached.nonstop, checkedAt: cached.checked_at, cached: true, stale: true });
    }
    return NextResponse.json({ price: null, error: "לא הצלחנו לבדוק מחיר טיסה כרגע" }, { status: 200 });
  }
}
