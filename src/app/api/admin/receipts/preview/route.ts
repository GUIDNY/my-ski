import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { morningConfigured, previewReceipt, saveDraftInMorning, PAY_METHODS } from "@/lib/morning";
import { receiptDraftFromOrder } from "@/lib/receipt-build";

/*
 * A DRAFT of a receipt for one order. Two modes, both UNISSUED:
 *  - mode "morning" (default): saves a native draft (טיוטה) inside his morning
 *    account and returns its URL — editable there, no number, no email.
 *  - mode "pdf": only a PDF preview, creates nothing anywhere.
 * This route NEVER issues a document.
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
  const payMethod = draft.payMethod;
  try {
    if (b.mode === "pdf") {
      const { pdf } = await previewReceipt(draft);
      return NextResponse.json({ ok: true, pdf, method: PAY_METHODS.find(m => m.key === payMethod)?.label });
    }
    const { id, url } = await saveDraftInMorning(draft);
    return NextResponse.json({ ok: true, draftId: id, draftUrl: url, method: PAY_METHODS.find(m => m.key === payMethod)?.label });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "morning failed" }, { status: 502 });
  }
}
