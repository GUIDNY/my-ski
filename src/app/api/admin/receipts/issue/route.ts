import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { morningConfigured, issueReceipt, PAY_METHODS } from "@/lib/morning";
import { receiptDraftFromOrder } from "@/lib/receipt-build";

/*
 * ISSUE a real receipt (מסמך עם מספר) in morning for one payer of an order,
 * then record it on the order (ops.x_payments[row].receipt) so the admin
 * sees exactly who already got a receipt. No email is ever sent by morning.
 * Only reached from the admin's explicit הפק-קבלה confirmation.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  if (!morningConfigured()) return NextResponse.json({ error: "חסרים MORNING_API_KEY / MORNING_API_SECRET ב-Vercel" }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const db = createServerClient();
  const { data: o } = await db.from("orders").select("*").eq("id", String(b.order_id || "")).single();
  if (!o) return NextResponse.json({ error: "order not found" }, { status: 404 });

  const draft = receiptDraftFromOrder(o, b);
  if (!(draft.amount > 0)) return NextResponse.json({ error: "חסר סכום" }, { status: 400 });

  try {
    const receipt = await issueReceipt(draft);
    // record who got a receipt on the order's payments list
    const ops = (o.ops as Record<string, unknown>) || {};
    type Row = { name?: string; amount?: string; currency?: string; method?: string; receipt?: unknown };
    const rows: Row[] = Array.isArray(ops.x_payments) ? [...(ops.x_payments as Row[])] : [];
    const rec = { ...receipt, at: new Date().toISOString() };
    const idx = Number.isInteger(b.rowIndex) && rows[Number(b.rowIndex)] ? Number(b.rowIndex) : rows.findIndex(r => !r.receipt && String(r.name || "") === draft.clientName);
    if (idx >= 0 && rows[idx]) rows[idx] = { ...rows[idx], name: draft.clientName, amount: String(draft.amount), currency: draft.currency, method: draft.payMethod, receipt: rec };
    else rows.push({ name: draft.clientName, amount: String(draft.amount), currency: draft.currency, method: draft.payMethod, receipt: rec });
    await db.from("orders").update({ ops: { ...ops, x_payments: rows } }).eq("id", o.id);
    return NextResponse.json({ ok: true, receipt: rec, rows, method: PAY_METHODS.find(m => m.key === draft.payMethod)?.label });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "morning issue failed" }, { status: 502 });
  }
}
