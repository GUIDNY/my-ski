import { NextRequest, NextResponse } from "next/server";

/*
 * Tells Bing (and through it ChatGPT search, Copilot and the other IndexNow
 * engines) that the pages in the sitemap changed, once a day, so the prices
 * they quote stay fresh. The key is public by design: it is served at
 * /<key>.txt to prove the site owns it.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const HOST = "skisharebook.com";
const KEY = "34ee419c65ffaaee3d1f26b4df867313";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const xml = await fetch(`https://${HOST}/sitemap.xml`, { cache: "no-store" }).then(r => r.text());
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()).slice(0, 10000);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  });
  return NextResponse.json({ status: res.status, sent: urlList.length });
}
