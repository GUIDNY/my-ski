import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { airbnbListings } from "@/lib/hostex-sync";
import { N8N_UA } from "@/lib/airbnb-calendar";

/*
 * The bookings calendar (/seller/calendar, sellers and admins): one row per apartment,
 * one bar per stay, like Hostex's calendar.
 *   - Airbnb (and other Hostex) reservations come from n8n "SkiShare – אתר: לוח הזמנות"
 *     (`${N8N_SITE_URL}/bookings`), which reads Hostex: guest name and dates only.
 *   - Site orders (approved / hold) come from our own orders table, so they show at once
 *     and with the order code; the named copies n8n keeps in Hostex are skipped.
 *   - Two stays on the same night in the same row are flagged as a clash.
 * GET ?from=YYYY-MM-DD&days=N (7..62)
 */
export const dynamic = "force-dynamic";

type Bar = {
  id: string; row: string; start: string; end: string; // end = check-out day
  title: string; source: "site" | "airbnb" | "other"; channel: string;
  codes?: string[]; status?: string; guests?: number | null; clash?: boolean;
};
type Row = { id: string; title: string; hostex: boolean };

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const day = (s: string) => Date.parse(s.slice(0, 10) + "T12:00:00Z");
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

type HostexCal = {
  properties: { id: number; title: string; listing_ids: string[] }[];
  reservations: { code: string; property_id: number; channel: string; guest: string; check_in: string; check_out: string; guests: number | null; site: boolean }[];
};

async function hostexCalendar(from: string, to: string): Promise<HostexCal | null> {
  const base = process.env.N8N_SITE_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/bookings?from=${from}&to=${to}`, {
      cache: "no-store", headers: { "User-Agent": N8N_UA }, signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j?.ok && Array.isArray(j.properties) && Array.isArray(j.reservations) ? j : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;

  const q = req.nextUrl.searchParams;
  const fromQ = q.get("from") || "";
  const from = /^\d{4}-\d{2}-\d{2}$/.test(fromQ) ? fromQ : iso(day(today()) - 3 * 86400000);
  const days = Math.min(62, Math.max(7, Number(q.get("days")) || 35));
  const to = iso(day(from) + days * 86400000); // first day NOT shown

  const db = createServerClient();
  // check-out range for Hostex: stays that end inside the window, plus long ones ending up to 120 days later
  const [cal, listings, ordersRes] = await Promise.all([
    hostexCalendar(from, iso(day(to) + 120 * 86400000)),
    airbnbListings(db),
    db.from("orders")
      .select("code, status, customer_name, apartment_id, extra_apartment_id, apartment_name, checkin, checkout, guests, group_id, created_at")
      .in("status", ["approved", "hold"]).lt("checkin", to).gt("checkout", from)
      .order("created_at", { ascending: true }),
  ]);

  const rows: Row[] = [];
  const rowOfListing: Record<string, string> = {};
  for (const p of (cal?.properties ?? []).slice().sort((a, b) => a.title.localeCompare(b.title))) {
    rows.push({ id: `h${p.id}`, title: p.title, hostex: true });
    for (const l of p.listing_ids) rowOfListing[l] = `h${p.id}`;
  }

  const bars: Bar[] = [];
  for (const r of cal?.reservations ?? []) {
    if (r.site) continue; // the site order itself is drawn below
    if (r.check_out <= from || r.check_in >= to) continue;
    const airbnb = /airbnb/i.test(r.channel);
    bars.push({
      id: r.code, row: `h${r.property_id}`, start: r.check_in, end: r.check_out,
      title: r.guest || r.channel, source: airbnb ? "airbnb" : "other", channel: r.channel, guests: r.guests,
    });
  }

  // site orders: shares of one group (or the same apartment and dates) are one bar
  const siteBars = new Map<string, Bar>();
  const extraRows = new Map<string, Row>();
  for (const o of ordersRes.data ?? []) {
    const ci = String(o.checkin).slice(0, 10), co = String(o.checkout).slice(0, 10);
    for (const apt of [o.apartment_id, o.extra_apartment_id]) {
      if (!apt) continue;
      const listing = listings?.[apt];
      let row = listing ? rowOfListing[listing] : undefined;
      if (!row) {
        row = `a${apt}`;
        if (!extraRows.has(row)) extraRows.set(row, { id: row, title: o.apartment_name || "דירה", hostex: false });
      }
      const key = `${row}|${o.group_id || ci + co}`;
      const name = String(o.customer_name || "").split("(")[0].trim().slice(0, 40) || o.code;
      const b = siteBars.get(key);
      if (b) {
        b.codes!.push(o.code);
        if (ci < b.start) b.start = ci;
        if (co > b.end) b.end = co;
        b.guests = Math.max(b.guests || 0, o.guests || 0);
        if (o.status === "hold") b.status = "hold";
      } else {
        siteBars.set(key, {
          id: `s${o.code}-${row}`, row, start: ci, end: co, title: name, source: "site", channel: "אתר",
          codes: [o.code], status: o.status, guests: o.guests,
        });
      }
    }
  }
  bars.push(...siteBars.values());
  rows.push(...[...extraRows.values()].sort((a, b) => a.title.localeCompare(b.title, "he")));

  // clashes: two bars of one row sharing a night
  const byRow = new Map<string, Bar[]>();
  for (const b of bars) byRow.set(b.row, [...(byRow.get(b.row) || []), b]);
  for (const list of byRow.values()) {
    list.sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length && list[j].start < list[i].end; j++) list[i].clash = list[j].clash = true;
  }

  return NextResponse.json({
    ok: true, from, days, today: today(), hostex: !!cal,
    rows, bars,
  }, { headers: { "Cache-Control": "no-store" } });
}
