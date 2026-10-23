import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
export const maxDuration = 60;

// Only these choices pass through to the printable page; it prices them itself.
const KEYS = ["apartment_id", "checkin", "checkout", "guests", "cancel", "service", "x", "q", "rd", "ra", "od", "oa", "al"] as const;

/**
 * The quote as a PDF file: renders /quote/print (the branded proposal design,
 * priced on the server) in headless Chromium, the same browser setup the
 * flight scraper uses, and returns the A4 PDF.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  for (const k of KEYS) {
    const v = sp.get(k);
    if (v) qs.set(k, v.slice(0, 120));
  }
  if (!/^[0-9a-f-]{36}$/i.test(qs.get("apartment_id") ?? "")) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 });
  }
  const name = (sp.get("name") || "SkiShare").replace(/[\\/:*?"<>|\r\n]/g, "").slice(0, 60);
  const target = `${req.nextUrl.origin}/quote/print?${qs.toString()}`;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    // CHROME_PATH: a local Chromium for running this outside Vercel
    browser = await puppeteer.launch(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH, headless: true, args: ["--no-sandbox"] }
      : { args: chromium.args, executablePath: await chromium.executablePath(), headless: "shell" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754 });
    const res = await page.goto(target, { waitUntil: "networkidle0", timeout: 40000 });
    if (!res || !res.ok()) throw new Error(`print page answered ${res?.status()}`);
    await page.evaluate(async () => { await document.fonts.ready; });
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    const file = `הצעת מחיר SkiShare - ${name}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SkiShare-quote.pdf"; filename*=UTF-8''${encodeURIComponent(file)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("quote-pdf failed", e);
    return NextResponse.json({ error: "pdf failed" }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
