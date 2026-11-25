import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { cleanGear, gearTitle, gearTotal } from "@/lib/gear";
import { sendGearEmail } from "@/lib/gear-email";

/*
 * An equipment order paid later (/equipment, "מזמינים עכשיו, משלמים אחר כך"):
 * saved as an order waiting for payment, the customer gets the English email
 * for the shop, and Idan gets a message. The price is worked out here, never
 * taken from the browser.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const code = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
const nextDay = (iso: string) => new Date(Date.parse(iso + "T12:00:00Z") + 864e5).toISOString().slice(0, 10);

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const gear = cleanGear(b.gear);
  const name = String(b.name || "").trim().slice(0, 80);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
  const phone = String(b.phone || "").trim().slice(0, 30);
  if (!gear) return NextResponse.json({ error: "חסרים תאריכים או שמות" }, { status: 400 });
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.length < 7) return NextResponse.json({ error: "חסרים שם, מייל או טלפון" }, { status: 400 });

  const db = createServerClient();
  const row = {
    apartment_id: null, apartment_name: gearTitle(gear), area: "Val Thorens",
    checkin: gear.from, checkout: nextDay(gear.to), guests: gear.people.length, nights: gear.days,
    ski_pass: false, transfer: false, equipment: true, flight: false, cancel: "none", service: "human",
    total_eur: gearTotal(gear),
    customer_name: name, customer_email: email, customer_phone: phone,
    ops: { x_gear: gear, x_pay_later: true },
  };
  let saved: { id: string; code: string } | null = null;
  for (let i = 0; i < 5 && !saved; i++) {
    const { data, error } = await db.from("orders").insert({ code: code(), ...row }).select("id, code").single();
    if (data) saved = data;
    else if (error && !/duplicate|unique/i.test(error.message)) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!saved) return NextResponse.json({ error: "could not allocate code" }, { status: 500 });

  const origin = req.nextUrl.origin;
  const emailed = await sendGearEmail({ ...row, code: saved.code }, origin, false);

  // a message to Idan (the same n8n alert as a payment, with nothing paid)
  const alert = process.env.N8N_PAY_ALERT_URL;
  if (alert) {
    try {
      await fetch(alert, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          amount: 0, currency: "EUR", fromLink: false, order: saved.code, name, phone, email,
          description: `הזמנת ציוד חדשה (עוד לא שולם, €${row.total_eur}): ${gear.people.map(p => `${p.name} ${p.kind === "ski" ? "סקי" : "סנובורד"}${p.helmet ? " + קסדה" : ""}`).join(", ")} · ${gear.from} עד ${gear.to}`,
        }),
      });
    } catch { /* the order is saved either way */ }
  }
  return NextResponse.json({ ok: true, code: saved.code, total: row.total_eur, emailed }, { status: 201 });
}
