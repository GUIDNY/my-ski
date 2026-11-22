import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { createServerClient } from "@/lib/supabase-server";
import { buildSiteProposal } from "@/lib/site-proposal";
import { quoteChoices, shortName } from "@/lib/quotes";

export const runtime = "nodejs";
export const maxDuration = 30;

/*
 * The link preview of a site quote (/q/<name>/<id>), what WhatsApp shows under the link:
 * the apartments' photos fading into a dark panel with the logo, the apartment, the dates,
 * what's included and the price per person.
 * Satori has no bidi and wraps left to right, so Hebrew lines are wrapped here first and
 * every line is reversed on its own (rtlLines). A JPEG: WhatsApp drops heavy preview images.
 */

const NAVY = "#0B1B33", SKY = "#A9C2EA", ACCENT = "#3D7BFF";
const W = 1200, H = 630, PHOTOS = 760;

/** one line for Satori: the words in reverse order, the letters of Hebrew words reversed */
function rtl(s: string) {
  return s.split(/(\s+)/).reverse().map(w => (/[֐-׿]/.test(w) ? [...w].reverse().join("").replace(/[()]/g, c => (c === "(" ? ")" : "(")) : w)).join("");
}
/** wrap by an estimate of the width (Heebo ≈ 0.52em a letter), at most `max` lines, then rtl() each */
function rtlLines(s: string, size: number, width: number, max = 2) {
  const per = Math.max(6, Math.floor(width / (size * 0.5)));
  const lines: string[] = [];
  for (const w of s.split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last + " " + w).length <= per) lines[lines.length - 1] = last + " " + w;
    else lines.push(w);
  }
  const out = lines.slice(0, max);
  if (lines.length > max) out[max - 1] = out[max - 1].replace(/\s*\S+$/, "") + "…";
  return out.map(rtl);
}

async function photo(url: string | undefined, w: number, h: number): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const buf = await sharp(Buffer.from(await r.arrayBuffer())).rotate().resize(w, h, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch { return null; }
}

let whiteLogo: Promise<string | null> | null = null;
/** the site logo, white, for the dark panel */
function logo() {
  whiteLogo ??= readFile(join(process.cwd(), "public/skishare-logo.png"))
    .then(b => sharp(b).trim().resize({ height: 120 }).negate({ alpha: false }).png().toBuffer())
    .then(b => `data:image/png;base64,${b.toString("base64")}`)
    .catch(() => null);
  return whiteLogo;
}

const INCLUDED: Record<string, string> = { apartment: "דירה", skipass: "סקי פס", transfer: "הסעה", equipment: "ציוד", flight: "טיסה" };

function Tick() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="13" fill={ACCENT} />
      <path d="M7.5 13.5 L11.2 17 L18.5 9.5" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
  const two = own.length > 1;
  const all = blocks.flatMap(b => (b.type === "gallery" ? b.urls : []));
  const first = r.data.hero?.image ?? all[0];
  const [p1, p2, white, medium, bold] = await Promise.all([
    photo(two ? own[0].urls[0] : first, two ? PHOTOS / 2 : PHOTOS, H),
    two ? photo(own[1].urls[0], PHOTOS / 2, H) : Promise.resolve(null),
    logo(),
    readFile(join(process.cwd(), "assets/fonts/heebo-500.ttf")),
    readFile(join(process.cwd(), "assets/fonts/heebo-800.ttf")),
  ]);

  const hero = r.data.hero;
  const names = two ? own.map(g => shortName(g.caption as string)) : [shortName(r.data.title)];
  const title = two ? names.join(" + ") : names[0];
  const chips = hero?.chips ?? [];
  const facts = [chips[0], chips[1]?.startsWith("שבוע שלם") ? "7 לילות" : chips[1], chips[2]].filter(Boolean).join(" · ");
  // just "דירה" says nothing: the list shows only when something comes with it
  const incKeys = hero?.included ?? ["apartment"];
  const included = incKeys.length > 1 ? incKeys.map(k => INCLUDED[k]).filter(Boolean) : [];
  const PANEL = W - PHOTOS + 120; // the panel starts over the photos' faded edge
  const textW = PANEL - 120 - 96;
  const titleSize = title.length > 34 ? 40 : 46;

  const png = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: NAVY, fontFamily: "Heebo" }}>
        {/* photos, left */}
        <div style={{ position: "absolute", left: 0, top: 0, width: PHOTOS, height: H, display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p1 ? <img src={p1} alt="" width={two ? PHOTOS / 2 : PHOTOS} height={H} style={{ objectFit: "cover" }} /> : <div style={{ display: "flex", width: PHOTOS, height: H, background: "#1E3A66" }} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {two && p2 && <img src={p2} alt="" width={PHOTOS / 2} height={H} style={{ objectFit: "cover", borderLeft: `4px solid ${NAVY}` }} />}
        </div>
        {/* bottom shade on the photos, for the names */}
        {two && <div style={{ position: "absolute", left: 0, bottom: 0, width: PHOTOS, height: 180, backgroundImage: "linear-gradient(to bottom, rgba(11,27,51,0), rgba(11,27,51,0.75))" }} />}
        {two && names.map((n, i) => (
          <div key={i} style={{ position: "absolute", bottom: 30, left: i === 0 ? 26 : PHOTOS / 2 + 26, display: "flex", padding: "8px 18px", borderRadius: 999, background: "rgba(255,255,255,0.94)", color: NAVY, fontSize: 24, fontWeight: 800, maxWidth: PHOTOS / 2 - 70 }}>
            {rtlLines(n, 24, PHOTOS / 2 - 110, 1)[0]}
          </div>
        ))}
        {/* the photos fade into the panel */}
        <div style={{ position: "absolute", left: PHOTOS - 240, top: 0, width: 240, height: H, backgroundImage: `linear-gradient(to right, rgba(11,27,51,0), ${NAVY})` }} />

        {/* panel, right */}
        <div style={{ position: "absolute", right: 0, top: 0, width: PANEL - 120, height: H, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", padding: "40px 48px 40px 0", color: "white" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {white ? <img src={white} alt="" height={58} style={{ height: 58 }} /> : <div style={{ fontSize: 34, fontWeight: 800 }}>SkiShare</div>}
            <div style={{ display: "flex", marginTop: 26, fontSize: 22, fontWeight: 800, color: SKY, letterSpacing: 1 }}>{rtl("הצעת מחיר אישית · ואל טורנס")}</div>
            {rtlLines(title, titleSize, textW, 2).map((l, i) => (
              <div key={i} style={{ display: "flex", fontSize: titleSize, fontWeight: 800, lineHeight: 1.12, marginTop: i ? 0 : 8 }}>{l}</div>
            ))}
            <div style={{ display: "flex", marginTop: 14, fontSize: 24, fontWeight: 500, color: SKY }}>{rtlLines(facts, 20, textW, 1)[0]}</div>
            <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: 18, marginTop: 20 }}>
              {included.map(k => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 500 }}>
                  <div style={{ display: "flex" }}>{rtl(k)}</div>
                  <Tick />
                </div>
              ))}
            </div>
          </div>
          {/* the price */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", background: "white", borderRadius: 24, padding: "18px 28px 16px", color: NAVY }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 500, color: "#51627F" }}>{rtl("לאדם")}</div>
              <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1 }}>{hero?.perPerson ?? ""}</div>
            </div>
            {hero?.total && <div style={{ display: "flex", fontSize: 21, fontWeight: 500, color: "#51627F", marginTop: 4 }}>{rtl(`סה״כ ${hero.total} לכל החבורה`)}</div>}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: [{ name: "Heebo", data: medium, weight: 500, style: "normal" }, { name: "Heebo", data: bold, weight: 800, style: "normal" }] },
  );
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 84 }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
