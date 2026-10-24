import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

/**
 * Headless Chromium for the PDF routes. On a cold start the Chromium binary
 * is still being unpacked, and launching it right then fails with ETXTBSY
 * ("text file busy"); waiting a moment and trying again fixes it.
 * CHROME_PATH: a local Chromium for running outside Vercel.
 */
export async function launchPdfBrowser() {
  let last: unknown;
  for (let i = 0; i < 4; i++) {
    try {
      return await puppeteer.launch(process.env.CHROME_PATH
        ? { executablePath: process.env.CHROME_PATH, headless: true, args: ["--no-sandbox"] }
        : { args: chromium.args, executablePath: await chromium.executablePath(), headless: "shell" });
    } catch (e) {
      last = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (!/ETXTBSY|EBUSY|ENOENT|spawn/i.test(msg)) throw e;
      await new Promise(r => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw last;
}
