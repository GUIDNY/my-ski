import { NextResponse, type NextRequest } from "next/server";
import { aptSegment } from "@/lib/apartment-url";

/*
 * Old apartment addresses (/apartments/<id>, /en/apartments/<id>) move for
 * good to the readable one (lib/apartment-url) with a real 308, dates and
 * guests kept. The pages redirect too, but by then the page has started
 * streaming, so they can only do it in the HTML.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function proxy(req: NextRequest) {
  const m = req.nextUrl.pathname.match(/^(\/(?:en|fr))?\/apartments\/([^/]+)$/);
  if (!m || !UUID.test(m[2])) return NextResponse.next();
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/apartments?id=eq.${m[2].toLowerCase()}&select=id,name,type,max_guests`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, signal: AbortSignal.timeout(3000) },
    );
    const [apt] = r.ok ? await r.json() : [];
    if (!apt) return NextResponse.next(); // the page shows the 404
    const url = req.nextUrl.clone();
    url.pathname = `${m[1] ?? ""}/apartments/${aptSegment(apt)}`;
    return NextResponse.redirect(url, 308);
  } catch {
    return NextResponse.next(); // the page still moves it (in the HTML)
  }
}

export const config = { matcher: ["/apartments/:id", "/en/apartments/:id", "/fr/apartments/:id"] };
