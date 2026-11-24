import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { morningConfigured, issueReceipt, saveDraftInMorning, PAY_METHODS, type ReceiptDraft } from "@/lib/morning";

/*
 * Receipts for a booking of the hostel in Mayrhofen (a property_payments row,
 * kind "booking"). mode "draft": a native draft (טיוטה) in morning, no number,
 * nothing recorded. mode "issue": a real receipt (מסמך עם מספר), recorded on
 * the row (property_payments.receipt). morning never emails the customer.
 * A manual receipt (no booking: property_id instead of payment_id) is kept as
 * its own row, kind "receipt", so it is listed on the hostel page.
 */
const dm = (d: string | null | undefined) => d ? `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}.${d.slice(0, 4)}` : "";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!morningConfigured()) return NextResponse.json({ error: "חסרים MORNING_API_KEY / MORNING_API_SECRET ב-Vercel" }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const db = createServerClient();
  type Row = { id?: string; label?: string; amount?: number; due_date?: string | null; month?: string | null; receipt?: unknown };
  let p: Row;
  const manual = !b.payment_id;
  if (manual) {
    const { data: prop } = await db.from("managed_properties").select("id, kind").eq("id", String(b.property_id || "")).single();
    if (!prop || prop.kind !== "hostel") return NextResponse.json({ error: "hostel not found" }, { status: 404 });
    p = { label: String(b.clientName || ""), amount: Number(b.amount) || 0, due_date: null, month: null };
  } else {
    const { data } = await db.from("property_payments").select("*").eq("id", String(b.payment_id)).single();
    if (!data) return NextResponse.json({ error: "booking not found" }, { status: 404 });
    p = data;
  }

  const amount = Number(b.amount) > 0 ? Number(b.amount) : Number(p.amount) || 0;
  if (!(amount > 0)) return NextResponse.json({ error: "חסר סכום" }, { status: 400 });
  const dates = p.due_date ? ` · ${dm(p.due_date)}${p.month ? `–${dm(p.month)}` : ""}` : "";
  const draft: ReceiptDraft = {
    clientName: String(b.clientName || "").trim() || String(p.label || "").trim() || "לקוח/ה",
    amount,
    currency: b.currency === "ILS" ? "ILS" : "EUR",
    payMethod: PAY_METHODS.some(m => m.key === b.payMethod) ? String(b.payMethod) : "transfer",
    description: (String(b.description || "").trim() || `לינה בהוסטל במאיירהופן${dates}`).slice(0, 250),
    remarks: "הוסטל מאיירהופן · skisharebook.com",
  };

  try {
    if (b.mode === "issue") {
      if (p.receipt && !(p.receipt as { manual?: boolean }).manual) return NextResponse.json({ error: "כבר הופקה קבלה להזמנה הזאת" }, { status: 409 });
      const receipt = await issueReceipt(draft);
      const rec = { ...receipt, name: draft.clientName, amount, currency: draft.currency, method: draft.payMethod, at: new Date().toISOString() };
      if (manual) {
        await db.from("property_payments").insert({
          property_id: String(b.property_id), kind: "receipt", label: draft.clientName, amount, paid: true,
          paid_date: rec.at.slice(0, 10), note: draft.description, receipt: rec,
        });
      } else {
        await db.from("property_payments").update({ receipt: rec }).eq("id", p.id);
      }
      return NextResponse.json({ ok: true, receipt: rec });
    }
    const { url } = await saveDraftInMorning(draft);
    return NextResponse.json({ ok: true, draftUrl: url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "morning failed" }, { status: 502 });
  }
}
