import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { airlineName, checkinUrl, cleanFlight, zonedMs } from "@/lib/flight-checkin";

/*
 * Every hour (n8n "SkiShare – תזכורת צ'ק-אין לטיסה", and Vercel cron as a backup):
 * an email to the guest 24 hours before each flight of the order, with the
 * airline's check-in button and the booking code. Each flight once (ops.x_flight.remOut/remRet).
 * Nothing is returned but counts, and a call only sends what is due anyway, so it needs no key.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const H = 3600_000;
const SITE = "https://skisharebook.com";

export async function GET() {
  const hook = process.env.N8N_WEBHOOK_URL;
  if (!hook) return NextResponse.json({ ok: false, error: "no mail hook" });
  const db = createServerClient();
  const today = new Date(Date.now() - 2 * 86400_000).toISOString().slice(0, 10);
  const { data, error } = await db.from("orders")
    .select("id, code, customer_name, customer_email, status, ops, checkout")
    .in("status", ["approved", "hold"]).eq("flight", true).gte("checkout", today);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const now = Date.now();
  let sent = 0;
  for (const o of data ?? []) {
    const ops = (o.ops as Record<string, unknown>) || {};
    const f = cleanFlight(ops.x_flight);
    if (!f || !o.customer_email) continue;
    let changed = false;
    for (const [k, l, tz, rem] of [["out", f.out, "Asia/Jerusalem", "remOut"], ["ret", f.ret, "Europe/Paris", "remRet"]] as const) {
      if (!l.date || f[rem]) continue;
      const dep = zonedMs(l.date, l.time || "12:00", tz);
      // check-in usually opens 24-30 hours before: the email goes out 25 to 2 hours before
      if (now < dep - 25 * H || now > dep - 2 * H) continue;
      try {
        const r = await fetch(hook, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "flight_checkin", type: "flight_checkin",
            order: { code: o.code, customer_name: o.customer_name, customer_email: o.customer_email, portal_url: `${SITE}/my?code=${o.code}` },
            flight: { leg: k, airline: airlineName(f), pnr: f.pnr, url: checkinUrl(f), date: l.date, time: l.time, no: l.no },
          }),
        });
        if (!r.ok) continue;
        f[rem] = new Date().toISOString();
        changed = true;
        sent++;
      } catch { /* the next hour */ }
    }
    if (changed) await db.from("orders").update({ ops: { ...ops, x_flight: f } }).eq("id", o.id);
  }
  return NextResponse.json({ ok: true, checked: data?.length ?? 0, sent });
}
