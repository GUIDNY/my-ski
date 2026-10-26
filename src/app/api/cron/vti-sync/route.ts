import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Jar, vtiFetch, vtiLogin } from "@/lib/vti-session";
import { parseDetail, parseResults, kindHe, PICTO_HE, type VtiOffer } from "@/lib/vti-parse";

/*
 * Daily sync of the Val Thorens Immobilier apartments (Idan's tour-operator account).
 * For every Saturday-to-Saturday week of the season: which lots are free and at what
 * TO price. Our price = TO price − 15% (the TO discount on every booking) + 20% (Idan,
 * 26.10.2026). Lots we don't have yet are added (a few per run: details, photos and a
 * Hebrew description). They live with the other weekly apartments (source "la_cime",
 * source_ref "vti:<ref>"), so the whole site shows and prices them like those.
 */

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TO_DISCOUNT = 0.85;
const MARKUP = 1.20;
const sell = (toPrice: number) => Math.round(toPrice * TO_DISCOUNT * MARKUP);

function seasonSaturdays(): Date[] {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const y = now.getFullYear();
  const seasons = [{ start: new Date(y - 1, 10, 28), end: new Date(y, 4, 3) }, { start: new Date(y, 10, 28), end: new Date(y + 1, 4, 3) }];
  const s = seasons.find(c => now <= c.end) ?? seasons[1];
  const from = now > s.start ? now : s.start;
  const first = new Date(from); first.setDate(first.getDate() + ((6 - from.getDay() + 7) % 7));
  const weeks: Date[] = [];
  for (const d = new Date(first); d <= s.end; d.setDate(d.getDate() + 7)) weeks.push(new Date(d));
  return weeks;
}
const fr = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
const frIso = (isoDay: string, plus: number) => { const d = new Date(isoDay + "T12:00:00"); d.setDate(d.getDate() + plus); return fr(d); };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

async function week(jar: Jar, sat: Date): Promise<VtiOffer[] | null> {
  const out = new Date(sat); out.setDate(out.getDate() + 7);
  const body = new URLSearchParams({ startDate: fr(sat), endDate: fr(out), take: "500", skip: "1", orderBy: "", comm_no: "0", comm_type: "DEFAUT", filtre: "", budget: "", package_qte: "" });
  try {
    const r = await vtiFetch(jar, "/fr-FR/Home/RefreshAvailabilities", {
      method: "POST", body: body.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
    });
    return r.status === 200 ? parseResults(r.html) : null;
  } catch { return null; }
}

async function hebrew(fr: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY || !fr) return "";
  const prompt = `Translate this ski apartment description from French into natural, simple Hebrew for an apartment listing in Val Thorens. Keep every fact (rooms, beds, m², floor, lift, balcony, kitchen equipment, distance to the slopes). Short sentences, one line per room or topic. Plain text only: no markdown, no asterisks, no headings symbols. Do not add anything. Leave out the agency, prices, registration numbers and map references (like "Plan de la station F3"). Return only the Hebrew text.\n\n${fr}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(25000),
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } }),
    });
    const j = await res.json();
    const out = String(j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "");
    return out.replace(/\*\*|__|^#+\s*/gm, "").split("\n").filter(l => !/מפת (האתר|העיירה|אתר הסקי)|מיקום במפה/.test(l)).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  } catch { return ""; }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const probe = process.env.VTI_PROBE_TOKEN && req.nextUrl.searchParams.get("t") === process.env.VTI_PROBE_TOKEN;
  if (!probe && process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const started = Date.now();
  const maxNew = Math.min(Number(req.nextUrl.searchParams.get("import") ?? 12) || 0, 40);

  let login: Awaited<ReturnType<typeof vtiLogin>>;
  try { login = await vtiLogin(); } catch (e) {
    await log(false, { error: e instanceof Error ? e.message : "login error" });
    return NextResponse.json({ error: "login error" }, { status: 502 });
  }
  if (!login.ok) { await log(false, { error: "login failed" }); return NextResponse.json({ error: "login failed" }, { status: 502 }); }
  const jar: Jar = login.jar;
  // a lot page errors (500) inside the TO session, but the public one has everything: details are read without it
  const pub = new Jar();

  // 1) every week of the season: who is free and at what price
  const weeks = seasonSaturdays();
  const results = await pool(weeks, 5, s => week(jar, s));
  const byRef = new Map<string, { offer: VtiOffer; weeks: { week: string; price: number }[] }>();
  let failed = 0;
  results.forEach((offers, i) => {
    if (!offers) { failed++; return; }
    for (const o of offers) {
      const e = byRef.get(o.ref) ?? { offer: o, weeks: [] };
      e.weeks.push({ week: iso(weeks[i]), price: sell(o.price) });
      if (o.images.length > e.offer.images.length) e.offer = o;
      byRef.set(o.ref, e);
    }
  });
  // a run that read nothing anywhere is a broken run (site changed, login lost): change nothing
  if (byRef.size === 0) {
    await log(false, { weeks: weeks.length, failed, note: "no offers found, nothing changed" });
    return NextResponse.json({ ok: false, weeks: weeks.length, failed });
  }

  // 2) the apartments we already have from this agency: update their weeks
  const { data: ours } = await db.from("apartments").select("id,source_ref").eq("source", "la_cime").like("source_ref", "vti:%");
  const have = new Map((ours ?? []).map(a => [String(a.source_ref).slice(4), a.id as string]));
  let updated = 0;
  await pool([...have], 8, async ([ref, id]) => {
    const w = byRef.get(ref)?.weeks ?? [];
    // a week a fetch missed is not "taken": keep the old list when some weeks failed and this lot has none now
    if (!w.length && failed) return;
    await db.from("apartments").update({ available_weeks: w, available: w.length > 0, ...(w.length ? { price_per_night: Math.round(Math.min(...w.map(x => x.price)) / 7 * 100) / 100 } : {}) }).eq("id", id);
    updated++;
  });

  // 3) new lots (and lots asked to be read again: ?refresh=REF,REF): details, photos, a Hebrew description
  const refresh = new Set((req.nextUrl.searchParams.get("refresh") || "").split(",").map(x => x.trim()).filter(Boolean));
  const fresh = [...byRef.values()].filter(e => !have.has(e.offer.ref) || refresh.has(e.offer.ref)).sort((a, b) => Number(refresh.has(b.offer.ref)) - Number(refresh.has(a.offer.ref)) || b.weeks.length - a.weeks.length);
  let added = 0; const addErrors: string[] = [];
  await pool(fresh.slice(0, maxNew), 4, async ({ offer, weeks: w }) => {
    if (Date.now() - started > 45000) return;
    try {
      const det = await vtiFetch(pub, "/fr-FR/Lot/Detail", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ lot_no: offer.lotNo, comm_no: "101", comm_type: "DEFAUT", startDate: frIso(w[0].week, 0), endDate: frIso(w[0].week, 7) }).toString(),
      });
      const d = parseDetail(det.html);
      const he = d.description ? await hebrew(d.description) : "";
      if (!he) { addErrors.push(`${offer.ref}: no translation`); return; }
      const type = d.rooms ? kindHe(d.rooms === 1 ? "Studio" : String(d.rooms), d.rooms) : kindHe(offer.kind);
      const images = (d.images.length ? d.images : offer.images).slice(0, 12);
      const row = {
        name: `${type} — ${offer.ref}`, type,
        beds: d.bedrooms || (type === "סטודיו" ? 1 : Math.max(1, (parseInt(offer.kind, 10) || 2) - 1)),
        baths: d.baths || 1, sqm: d.sqm || 0, max_guests: d.pax || offer.pax || 2,
        price_per_night: Math.round(Math.min(...w.map(x => x.price)) / 7 * 100) / 100,
        images, amenities: [...new Set(offer.pictos.map(p => PICTO_HE[p]).filter(Boolean))],
        description: he, available: w.length > 0,
        source: "la_cime", source_ref: `vti:${offer.ref}`, available_weeks: w,
      };
      if (!d.description) { addErrors.push(`${offer.ref}: no description on its page`); return; }
      const existing = have.get(offer.ref);
      const { error } = existing
        ? await db.from("apartments").update(row).eq("id", existing)
        : await db.from("apartments").insert(row);
      if (error) addErrors.push(`${offer.ref}: ${error.message}`); else added++;
    } catch (e) { addErrors.push(`${offer.ref}: ${e instanceof Error ? e.message : "error"}`); }
  });

  const summary = {
    weeks: weeks.length, failed, lotsSeen: byRef.size, updated, added,
    waiting: Math.max(0, fresh.length - added), errors: addErrors.slice(0, 8), ms: Date.now() - started,
  };
  await log(failed < weeks.length, summary);
  return NextResponse.json(summary);
}

async function log(ok: boolean, detail: Record<string, unknown>) {
  try { await db.from("sync_log").insert({ job: "vti_sync", ok, detail }); } catch { /* ignore */ }
}
