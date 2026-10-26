import { NextRequest, NextResponse } from "next/server";
import { vtiFetch, vtiLogin } from "@/lib/vti-session";

// TEMPORARY (26.10): a look at the Val Thorens Immobilier tour-operator area, to build the
// daily sync. Logs in with Idan's TO account and returns a page's links, forms and text.
// Guarded by VTI_PROBE_TOKEN; removed once the sync is built.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const strip = (h: string) => h
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim();

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t");
  if (!process.env.VTI_PROBE_TOKEN || t !== process.env.VTI_PROBE_TOKEN) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const path = req.nextUrl.searchParams.get("path") || "";
  const raw = req.nextUrl.searchParams.get("raw") === "1";
  try {
    const { jar, ok, landing } = await vtiLogin();
    const page = path && path.startsWith("/") ? await vtiFetch(jar, path) : landing;
    const user = process.env.VTI_TO_USER || "\u0000";
    const redact = (s: string) => s.split(user).join("[TO]");
    const links = [...page.html.matchAll(/<a\b[^>]*href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map(m => ({ href: m[1], text: strip(m[2]).slice(0, 80) })).filter(l => !/^javascript|^mailto|\.css|\.js/.test(l.href));
    const forms = [...page.html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)].map(m => ({
      attrs: m[1].replace(/\s+/g, " ").trim().slice(0, 200),
      inputs: [...m[2].matchAll(/<(?:input|select|textarea)\b[^>]*name="([^"]+)"/gi)].map(x => x[1]),
    }));
    return NextResponse.json({
      loggedIn: ok, url: page.url, status: page.status,
      title: strip(page.html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ""),
      links: links.slice(0, 150), forms,
      text: redact(strip(page.html)).slice(0, 12000),
      ...(raw ? { html: redact(page.html).slice(0, 60000) } : {}),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
