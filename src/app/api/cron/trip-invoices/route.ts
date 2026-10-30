import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { morningConfigured, issueReceipt } from "@/lib/morning";
import { dealDescription } from "@/lib/receipt-build";

/*
 * Daily (Vercel cron): on the day a vacation starts (checkin = today, IL time),
 * auto-issue the trip tax document in morning for every payer that already has
 * a receipt and no trip document yet: חשבונית מס (305) LINKED to that receipt,
 * so morning closes the receipt — exactly the UI's "הפקת מסמך מתוך מסמך"
 * (override type with MORNING_TRIP_DOC_TYPE). Idempotent: each row once.
 * morning never emails the customer.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Rec = { id?: string; number?: string; url?: string; at?: string; auto?: boolean; manual?: boolean };
type Row = { name?: string; amount?: string; currency?: string; method?: string; receipt?: Rec; tripDoc?: Rec };

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!morningConfigured()) return NextResponse.json({ ok: false, error: "morning not configured" });

  const db = createServerClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const { data, error } = await db.from("orders").select("*").eq("status", "approved").eq("checkin", today);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  let issued = 0; const failures: string[] = [];
  for (const o of data ?? []) {
    const ops = (o.ops as Record<string, unknown>) || {};
    const rows: Row[] = Array.isArray(ops.x_payments) ? [...(ops.x_payments as Row[])] : [];
    let changed = false;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.receipt || r.tripDoc || !(Number(r.amount) > 0)) continue;
      try {
        const doc = await issueReceipt({
          clientName: String(r.name || o.customer_name || "לקוח/ה"),
          clientPhone: String(o.customer_phone || "").trim() || undefined,
          amount: Number(r.amount),
          currency: r.currency === "EUR" ? "EUR" : "ILS",
          payMethod: String(r.method || "card_link"),
          description: dealDescription(o),
          remarks: `הזמנה ${o.code} · skisharebook.com` + (r.receipt.number ? ` · חשבונית מס עבור קבלה ${r.receipt.number}` : ""),
          docType: Number(process.env.MORNING_TRIP_DOC_TYPE || 305),
          linkedIds: r.receipt.id ? [r.receipt.id] : undefined,
        });
        rows[i] = { ...r, tripDoc: { ...doc, at: new Date().toISOString(), auto: true } };
        changed = true; issued++;
      } catch (e) {
        failures.push(`${o.code}/${r.name}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    if (changed) await db.from("orders").update({ ops: { ...ops, x_payments: rows } }).eq("id", o.id);
  }
  return NextResponse.json({ ok: true, today, orders: (data ?? []).length, issued, failures });
}
