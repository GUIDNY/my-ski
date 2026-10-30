import type { SupabaseClient } from "@supabase/supabase-js";
import { AIRLINES } from "@/lib/flight-checkin";

/*
 * Everything a paid quote says, as order fields: the apartment(s) (so the
 * personal area has their photos), dates, people, ski pass (and if it's the
 * 3 Vallées), the airport transfer, equipment and the flights (times →
 * the flight check-in card and the reminder email). Used when a payment comes
 * in through a quote's pay link (the callback) and from the admin ("השלם מההצעה").
 */

type Block = { type?: string; rows?: string[][]; urls?: string[]; text?: string; url?: string; label?: string; [k: string]: unknown };
type Data = { title?: string; hero?: { clientName?: string }; sections?: { heading?: string; blocks?: Block[] }[] };
export type ProposalRow = { id: string; proposal_number?: string | null; client_name?: string | null; client_phone?: string | null; client_email?: string | null; data: unknown };

const ISO = /(\d{4}-\d{2}-\d{2})\D+?(\d{4}-\d{2}-\d{2})/;
const to24 = (t: string) => {
  const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return "";
  let h = Number(m[1]);
  if (m[3]) { const pm = /pm/i.test(m[3]); if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12; }
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};
const airlineKey = (name: string) => AIRLINES.find(a => a.key !== "other" && name.toLowerCase().includes(a.name.toLowerCase()))?.key || name;
const dm = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}`; };

/** the order fields a quote gives (only what it really says) */
export async function orderFieldsFromProposal(db: SupabaseClient, p: ProposalRow) {
  const d = (p.data || {}) as Data;
  const blocks = (d.sections || []).flatMap(s => s.blocks || []);
  const summary = blocks.filter(b => b.type === "summary").flatMap(b => b.rows || []);
  const get = (k: string) => summary.find(r => r[0] === k)?.[1] || "";
  const rows = blocks.filter(b => b.type === "table").flatMap(b => b.rows || []).map(r => String(r[0] || ""));
  const flights = blocks.filter(b => b.type === "flight");

  const dates = get("תאריכים").match(ISO);
  const guests = parseInt(get("מספר אורחים"), 10) || 0;
  const names = (get("לינה") || "").split(" + ").map(s => s.trim()).filter(Boolean);
  // the apartments by their name on the site
  let apts: { id: string; name: string }[] = [];
  if (names.length) {
    const { data } = await db.from("apartments").select("id, name").in("name", names);
    apts = names.map(n => (data || []).find(a => a.name === n)).filter(Boolean) as { id: string; name: string }[];
  }
  const passRow = rows.find(r => /^סקי פס/.test(r)) || "";
  const transferRow = rows.find(r => /^הסעה/.test(r)) || "";
  const equip = rows.some(r => /ציוד/.test(r));
  const flightRow = rows.some(r => /^טיסות/.test(r));

  const out = flights.find(f => f.direction === "out"), ret = flights.find(f => f.direction === "return");
  const airportOf = (s: unknown) => /LYS|ליון/.test(String(s || "")) ? "LYS" : /GVA|ז'נבה|ז׳נבה/.test(String(s || "")) ? "GVA" : "";
  const leg = (f: Block | undefined, out: boolean) => f ? {
    date: String(f.date || ""), time: to24(String(f.depart || "")), no: "",
    ...(out ? { arr: to24(String(f.arrive || "")), airport: airportOf(f.to) } : { airport: airportOf(f.from) }),
  } : { date: "", time: "", no: "" };
  const airline = String(out?.airline || ret?.airline || "");
  const x_flight = flights.length ? { airline: airlineKey(airline), pnr: "", url: "", out: leg(out, true), ret: leg(ret, false) } : null;
  const flightDetails = flights.length ? [
    airline,
    out ? `הלוך ${dm(String(out.date))} ${to24(String(out.depart))}→${to24(String(out.arrive))}` : "",
    ret ? `חזור ${dm(String(ret.date))} ${to24(String(ret.depart))}→${to24(String(ret.arrive))}` : "",
  ].filter(Boolean).join(" · ") : null;

  const clientName = [p.client_name, d.hero?.clientName].map(s => String(s || "").trim()).find(s => s && !/^(לקוח יקר|Dear guest|בדיקה)$/i.test(s)) || "";
  return {
    apartment_id: apts[0]?.id ?? null,
    apartment_name: names[0] || d.title || "",
    extra_apartment_id: apts[1]?.id ?? null,
    extra_apartment_name: names[1] ?? null,
    checkin: dates?.[1] ?? null,
    checkout: dates?.[2] ?? null,
    nights: dates ? Math.max(0, Math.round((Date.parse(dates[2]) - Date.parse(dates[1])) / 864e5)) : 0,
    guests,
    ski_pass: !!passRow,
    transfer: !!transferRow,
    transfer_details: transferRow ? transferRow.replace(/^הסעה משדה התעופה\s*/, "").replace(/\s*—\s*הלוך-חזור$/, "").trim() || null : null,
    equipment: equip,
    flight: flightRow || flights.length > 0,
    flight_details: flightDetails,
    clientName,
    clientPhone: String(p.client_phone || "").trim(),
    clientEmail: String(p.client_email || "").trim(),
    ops: {
      x_pass3v: /3 Vall|שלושת העמקים/i.test(passRow),
      x_proposal: p.id,
      ...(x_flight ? { x_flight } : {}),
    },
  };
}

/** the quote behind a payment: by its id ("p:<id>"), its number (SK-2026-0062) or the payment page in its pay buttons */
export async function findProposal(db: SupabaseClient, by: { id?: string; number?: string; pageUid?: string }): Promise<ProposalRow | null> {
  const cols = "id, proposal_number, client_name, client_phone, client_email, data";
  if (by.id) {
    const { data } = await db.from("proposals").select(cols).eq("id", by.id).maybeSingle();
    if (data) return data as ProposalRow;
  }
  if (by.number) {
    const { data } = await db.from("proposals").select(cols).eq("proposal_number", by.number).maybeSingle();
    if (data) return data as ProposalRow;
  }
  if (by.pageUid && /^[\w-]{20,60}$/.test(by.pageUid)) {
    // the links are made before the quote is saved, so the quote is found by the payment page in it (recent quotes only)
    const since = new Date(Date.now() - 60 * 864e5).toISOString();
    const { data } = await db.from("proposals").select(cols).gte("created_at", since).order("created_at", { ascending: false }).limit(400);
    // the bot's links go through the terms page (/pay/go?d=<base64 of the PayPlus link>): read those too
    const text = (v: unknown) => {
      const j = JSON.stringify(v || {});
      const inner = [...j.matchAll(/\/pay\/go\?d=([\w-]+)/g)].map(m => { try { return Buffer.from(m[1], "base64url").toString(); } catch { return ""; } });
      return j + inner.join(" ");
    };
    const hit = (data || []).find(r => text(r.data).includes(by.pageUid!));
    if (hit) return hit as ProposalRow;
  }
  return null;
}
