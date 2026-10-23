// Card-size copies of the apartments' first photos, made before every build.
//
// The photos in storage are full size (1,600 to 2,048 px, up to half a
// megabyte), and every listing card loaded the original: on a phone the
// apartments page took over 7 seconds to show its first photo. This makes a
// 480 px and a 960 px WebP of each apartment's first photo into
// public/thumbs/ and lists them in src/lib/thumbs.json, which the cards use
// (src/lib/thumbs.ts). Nothing in storage or in the database changes.
//
// It never fails the build: on any problem it writes an empty list and the
// cards keep the originals. A photo added after the build shows the
// original until the next deploy.
import { createHash } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT_DIR = path.join(ROOT, "public", "thumbs");
const MANIFEST = path.join(ROOT, "src", "lib", "thumbs.json");
const WIDTHS = [480, 960];

async function writeManifest(map) {
  await writeFile(MANIFEST, JSON.stringify(map, null, 0) + "\n");
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) { console.log("thumbs: no database settings, skipped"); return writeManifest({}); }
  let sharp;
  try { sharp = (await import("sharp")).default; } catch { console.log("thumbs: sharp not installed, skipped"); return writeManifest({}); }

  const res = await fetch(`${url}/rest/v1/apartments?select=id,images&available=eq.true`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) { console.log(`thumbs: database answered ${res.status}, skipped`); return writeManifest({}); }
  const rows = await res.json();
  const firsts = [...new Set(rows.map(r => Array.isArray(r.images) ? r.images[0] : null).filter(u => typeof u === "string" && /^https:\/\//.test(u)))];

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const map = {};
  let made = 0;
  // a few at a time, so a slow photo doesn't hold up the rest
  const queue = [...firsts];
  async function worker() {
    for (let src = queue.shift(); src; src = queue.shift()) {
      try {
        const r = await fetch(src, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        const name = createHash("sha1").update(src).digest("hex").slice(0, 16);
        const entry = {};
        for (const w of WIDTHS) {
          const out = await sharp(buf).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
          await writeFile(path.join(OUT_DIR, `${name}-${w}.webp`), out);
          entry[w] = `/thumbs/${name}-${w}.webp`;
        }
        map[src] = entry;
        made++;
      } catch (e) {
        console.log(`thumbs: skipped one photo (${e?.message ?? e})`);
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  await writeManifest(map);
  console.log(`thumbs: ${made} of ${firsts.length} photos`);
}

main().catch(async e => {
  console.log(`thumbs: failed (${e?.message ?? e}), the cards keep the original photos`);
  try { await writeManifest({}); } catch { /* the committed empty list stays */ }
});
