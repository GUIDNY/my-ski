import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { createServerClient } from "@/lib/supabase-server";
import { buildSiteProposal } from "@/lib/site-proposal";
import { quoteChoices } from "@/lib/quotes";

export const runtime = "nodejs";
export const maxDuration = 30;

/*
 * The link preview of a site quote (/q/<name>/<id>), what WhatsApp shows under the link:
 * the apartments' photos, the dates, the people and the price per person.
 * Satori draws text left to right, so Hebrew lines are reversed here (rtl()).
 * A JPEG: WhatsApp drops preview images that are too heavy.
 */

const NAVY = "#0B1B33", ACCENT = "#2F6BFF";

/** Satori has no bidi: reverse the order of the words, and the letters of Hebrew words */
function rtl(s: string) {
  return s.split(/(\s+)/).reverse().map(w => (/[֐-׿]/.test(w) ? [...w].reverse().join("").replace(/[()]/g, c => (c === "(" ? ")" : "(")) : w)).join("");
}

async function photo(url: string | undefined, w: number, h: number): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const buf = await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize(w, h, { fit: "cover" }).jpeg({ quality: 78 }).toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch { return null; }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const xp = new URL(req.url).searchParams.get("x");
  const x = xp && /^[a-z0-9-]{1,60}$/i.test(xp) ? xp : null;
  if (!/^[a-z0-9]{4,12}$/i.test(id)) return new Response("not found", { status: 404 });
  const { data: q } = await createServerClient().from("quotes").select("*").eq("id", id).maybeSingle();
  if (!q) return new Response("not found", { status: 404 });
  const choices = quoteChoices(q, id, x);
  const r = await buildSiteProposal(k => choices[k] || "").catch(() => null);
  if (!r) return new Response("not found", { status: 404 });

  const blocks = r.data.sections.flatMap(s => s.blocks);
  const own = blocks.filter((b): b is Extract<typeof b, { type: "gallery" }> => b.type === "gallery" && !!b.caption);
  const all = blocks.flatMap(b => (b.type === "gallery" ? b.urls : []));
  // two apartments: one photo of each; one apartment: its two first photos
  const urls = own.length > 1 ? [own[0].urls[0], own[1].urls[0]] : [r.data.hero?.image ?? all[0], all.find(u => u !== (r.data.hero?.image ?? all[0]))];
  const [p1, p2] = await Promise.all([photo(urls[0], 700, 630), photo(urls[1], 700, 630)]);

  const [medium, bold] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/heebo-500.ttf")),
    readFile(join(process.cwd(), "assets/fonts/heebo-800.ttf")),
  ]);
  const hero = r.data.hero;
  const chips = hero?.chips?.slice(0, 3) ?? [];
  const names = own.length > 1 ? own.map(g => g.caption as string) : [r.data.title];

  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: NAVY, fontFamily: "Heebo" }}>
        {/* photos */}
        <div style={{ width: 700, height: 630, display: "flex", position: "relative" }}>
          {p1 && p2 ? (
            <div style={{ display: "flex", width: "100%", height: "100%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p1} alt="" width={348} height={630} style={{ objectFit: "cover" }} />
              <div style={{ width: 4, height: 630, background: NAVY }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p2} alt="" width={348} height={630} style={{ objectFit: "cover" }} />
            </div>
          ) : p1 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p1} alt="" width={700} height={630} style={{ objectFit: "cover" }} />
          ) : <div style={{ display: "flex", width: "100%", height: "100%", background: "#1E3A66" }} />}
          {own.length > 1 && (
            <div style={{ position: "absolute", top: 24, left: 24, display: "flex", padding: "8px 18px", borderRadius: 999, background: "white", color: NAVY, fontSize: 26, fontWeight: 800 }}>
              {rtl("שתי דירות יחד")}
            </div>
          )}
        </div>
        {/* text, right aligned */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", padding: "44px 44px 40px", color: "white", textAlign: "right" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 26, color: "#9FB6DD", fontWeight: 500 }}>{rtl("הצעת מחיר אישית · ואל טורנס")}</div>
            {names.map((n, i) => (
              <div key={i} style={{ fontSize: names.length > 1 ? 40 : 46, fontWeight: 800, lineHeight: 1.15, marginTop: i ? 2 : 14 }}>{rtl(n) + (i ? " +" : "")}</div>
            ))}
            <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
              {chips.map((c, i) => (
                <div key={i} style={{ display: "flex", padding: "6px 16px", borderRadius: 999, border: "2px solid #34507E", fontSize: 24, fontWeight: 500 }}>{rtl(c)}</div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontSize: 30, color: "#9FB6DD", fontWeight: 500 }}>{rtl("לאדם")}</div>
              <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1 }}>{hero?.perPerson ?? ""}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: "white" }}>SkiShare</div>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: ACCENT }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: [{ name: "Heebo", data: medium, weight: 500, style: "normal" }, { name: "Heebo", data: bold, weight: 800, style: "normal" }] },
  );
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82 }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
