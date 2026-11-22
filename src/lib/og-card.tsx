import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { heroOf } from "@/components/ProposalDocument";
import { shortName } from "@/lib/quotes";
import type { ProposalData } from "@/types";

/*
 * The link preview card every page shares (what WhatsApp, iMessage and Facebook show under a link):
 * photos on the left fading into a dark panel with the white logo, a kicker, a title, a line of
 * facts, what's included, and a white button at the bottom (no prices: Idan, 23.11). 1200×630 JPEG (WhatsApp drops heavy images).
 * Satori has no bidi and wraps left to right, so Hebrew lines are wrapped here first and every
 * line is reversed on its own (rtlLines).
 */

const NAVY = "#0B1B33", SKY = "#A9C2EA", ACCENT = "#3D7BFF";
const W = 1200, H = 630, PHOTOS = 760;

/** one line for Satori: the words in reverse order, the letters of Hebrew words reversed */
export function rtl(s: string) {
  return s.split(/(\s+)/).reverse().map(w => (/[֐-׿]/.test(w) ? [...w].reverse().join("").replace(/[()]/g, c => (c === "(" ? ")" : "(")) : w)).join("");
}
/** wrap by an estimate of the width (Heebo ≈ 0.5em a letter), at most `max` lines, then rtl() each */
export function rtlLines(s: string, size: number, width: number, max = 2, em = 0.47) {
  const per = Math.max(6, Math.floor(width / (size * em)));
  const lines: string[] = [];
  for (const w of s.split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last + " " + w).length <= per) lines[lines.length - 1] = last + " " + w;
    else lines.push(w);
  }
  const out = lines.slice(0, max);
  if (lines.length > max) out[max - 1] = out[max - 1].replace(/\s*\S+$/, "").replace(/[\s·,:–-]+$/, "") + "…";
  return out.map(rtl);
}

/** a photo, cut to size: a site URL, or a file in /public ("/view.jpg") */
async function photo(src: string | undefined | null, w: number, h: number): Promise<string | null> {
  if (!src) return null;
  try {
    const buf = src.startsWith("/")
      ? await readFile(join(process.cwd(), "public", src.replace(/^\/+/, "").replace(/\.\./g, "")))
      : Buffer.from(await (await fetch(src, { signal: AbortSignal.timeout(6000) })).arrayBuffer());
    const out = await sharp(buf).rotate().resize(w, h, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch { return null; }
}

let whiteLogo: Promise<string | null> | null = null;
function logo() {
  whiteLogo ??= readFile(join(process.cwd(), "public/skishare-logo.png"))
    .then(b => sharp(b).trim().resize({ height: 120 }).negate({ alpha: false }).png().toBuffer())
    .then(b => `data:image/png;base64,${b.toString("base64")}`)
    .catch(() => null);
  return whiteLogo;
}
let fonts: Promise<[Buffer, Buffer]> | null = null;
function heebo() {
  fonts ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/heebo-500.ttf")),
    readFile(join(process.cwd(), "assets/fonts/heebo-800.ttf")),
  ]);
  return fonts;
}

function Tick() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26">
      <circle cx="13" cy="13" r="13" fill={ACCENT} />
      <path d="M7.5 13.5 L11.2 17 L18.5 9.5" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type OgCard = {
  /** one photo, or two side by side (with `labels` on them) */
  photos: (string | null | undefined)[];
  labels?: string[];
  kicker: string;
  title: string;
  facts?: string;
  included?: string[];
  /** the white button at the bottom (the site's address when not given) */
  cta?: string;
};

export async function ogCard(c: OgCard, cacheSeconds = 3600): Promise<Response> {
  const two = c.photos.filter(Boolean).length > 1;
  const [p1, p2, white, [medium, bold]] = await Promise.all([
    photo(c.photos[0], two ? PHOTOS / 2 : PHOTOS, H),
    two ? photo(c.photos[1], PHOTOS / 2, H) : Promise.resolve(null),
    logo(),
    heebo(),
  ]);
  const PANEL = W - PHOTOS + 120;
  const textW = PANEL - 120 - 60;
  const titleSize = c.title.length > 40 ? 38 : c.title.length > 26 ? 42 : 46;
  const labels = two ? (c.labels ?? []) : [];

  const png = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: NAVY, fontFamily: "Heebo" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: PHOTOS, height: H, display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p1 ? <img src={p1} alt="" width={two ? PHOTOS / 2 : PHOTOS} height={H} style={{ objectFit: "cover" }} /> : <div style={{ display: "flex", width: PHOTOS, height: H, background: "#1E3A66" }} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {two && p2 && <img src={p2} alt="" width={PHOTOS / 2} height={H} style={{ objectFit: "cover", borderLeft: `4px solid ${NAVY}` }} />}
        </div>
        {labels.length > 0 && <div style={{ position: "absolute", left: 0, bottom: 0, width: PHOTOS, height: 180, backgroundImage: "linear-gradient(to bottom, rgba(11,27,51,0), rgba(11,27,51,0.75))" }} />}
        {labels.slice(0, 2).map((n, i) => (
          <div key={i} style={{ position: "absolute", bottom: 30, left: i === 0 ? 26 : PHOTOS / 2 + 26, display: "flex", padding: "8px 18px", borderRadius: 999, background: "rgba(255,255,255,0.94)", color: NAVY, fontSize: 24, fontWeight: 800 }}>
            {rtlLines(n, 24, PHOTOS / 2 - 110, 1)[0]}
          </div>
        ))}
        <div style={{ position: "absolute", left: PHOTOS - 240, top: 0, width: 240, height: H, backgroundImage: `linear-gradient(to right, rgba(11,27,51,0), ${NAVY})` }} />

        <div style={{ position: "absolute", right: 0, top: 0, width: PANEL - 120, height: H, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", padding: "40px 48px 40px 0", color: "white" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {white ? <img src={white} alt="" height={58} style={{ height: 58 }} /> : <div style={{ fontSize: 34, fontWeight: 800 }}>SkiShare</div>}
            <div style={{ display: "flex", marginTop: 26, fontSize: 22, fontWeight: 800, color: SKY, letterSpacing: 1 }}>{rtlLines(c.kicker, 22, textW, 1)[0]}</div>
            {rtlLines(c.title, titleSize, textW, 3, 0.52).map((l, i) => (
              <div key={i} style={{ display: "flex", whiteSpace: "nowrap", fontSize: titleSize, fontWeight: 800, lineHeight: 1.12, marginTop: i ? 0 : 8 }}>{l}</div>
            ))}
            {c.facts && rtlLines(c.facts, 22, textW, 2).map((l, i) => (
              <div key={i} style={{ display: "flex", whiteSpace: "nowrap", marginTop: i ? 2 : 14, fontSize: 22, fontWeight: 500, color: SKY }}>{l}</div>
            ))}
            {c.included && c.included.length > 0 && (
              <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", gap: 18, marginTop: 20, maxWidth: textW }}>
                {c.included.map(k => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 500 }}>
                    <div style={{ display: "flex" }}>{rtl(k)}</div>
                    <Tick />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "white", borderRadius: 999, padding: "14px 28px", color: NAVY, fontSize: 26, fontWeight: 800 }}>
            <div style={{ display: "flex" }}>←</div>
            <div style={{ display: "flex" }}>{c.cta ? rtl(c.cta) : "skisharebook.com"}</div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: [{ name: "Heebo", data: medium, weight: 500, style: "normal" }, { name: "Heebo", data: bold, weight: 800, style: "normal" }] },
  );
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 84 }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400` } });
}

const INCLUDED: Record<string, string> = { apartment: "דירה", skipass: "סקי פס", transfer: "הסעה", equipment: "ציוד", flight: "טיסה" };

/** a quote (site /q, bot /p, the two-apartment page): its photos, names, dates and what's included */
export function proposalCard(data: ProposalData, kicker = "הצעת מחיר אישית · ואל טורנס"): OgCard {
  const blocks = data.sections.flatMap(s => s.blocks);
  const own = blocks.filter((b): b is Extract<typeof b, { type: "gallery" }> => b.type === "gallery" && !!b.caption);
  const two = own.length > 1;
  const all = blocks.flatMap(b => (b.type === "gallery" ? b.urls : []));
  const hero = heroOf(data);
  const names = two ? own.map(g => shortName(g.caption as string)) : [shortName(data.title)];
  const chips = hero.chips ?? [];
  const keys = hero.included ?? ["apartment"];
  return {
    photos: two ? [own[0].urls[0], own[1].urls[0]] : [hero.image ?? all[0] ?? "/view.jpg"],
    labels: two ? names : undefined,
    kicker,
    title: two ? names.join(" + ") : names[0],
    facts: [chips[0], chips[1]?.startsWith("שבוע שלם") ? "7 לילות" : chips[1], chips[2]].filter(Boolean).join(" · "),
    // just "דירה" says nothing: the list shows only when something comes with it
    included: keys.length > 1 ? keys.map(k => INCLUDED[k]).filter(Boolean) : [],
    cta: "להצעה המלאה",
  };
}
