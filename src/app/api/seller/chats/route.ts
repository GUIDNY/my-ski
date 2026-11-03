import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { chatAdmin } from "@/lib/helper-chat";
import { createServerClient } from "@/lib/supabase-server";
import { phoneDigits } from "@/lib/sellers";
import { recordTouch } from "@/lib/seller-store";

/*
 * The seller's leads & chats (/seller/chats): the same leads, conversations and
 * actions as /admin/chats (n8n "SkiShare WhatsApp leads"). When he writes to a
 * customer, the lead is remembered as his (seller-store "touched"): an order from
 * that phone after it counts as his order.
 */
export const dynamic = "force-dynamic";

const LEAD = /^(web_[A-Za-z0-9_-]{16,64}|\d{8,15})$/;

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const lead = req.nextUrl.searchParams.get("lead") || "";
  if (lead) {
    if (!LEAD.test(lead)) return NextResponse.json({ ok: false }, { status: 400 });
    const r = await chatAdmin({ action: "thread", lead });
    if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
    return NextResponse.json(r);
  }
  const [r, { data: orders }] = await Promise.all([
    chatAdmin({ action: "list" }),
    createServerClient().from("orders").select("code, customer_phone, total_eur, status, checkin, apartment_name, created_at")
      .in("status", ["approved", "hold"]).order("created_at", { ascending: false }).limit(500),
  ]);
  if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
  const byPhone = new Map<string, { code: string; total: number; status: string; checkin: string | null; apartment: string }>();
  for (const o of orders ?? []) {
    const d = phoneDigits(o.customer_phone);
    if (d.length >= 9 && !byPhone.has(d)) byPhone.set(d, { code: o.code, total: Number(o.total_eur) || 0, status: o.status, checkin: o.checkin, apartment: o.apartment_name });
  }
  const chats = ((r.chats as Record<string, unknown>[]) || []).map(c => ({ ...c, order: c.phone ? byPhone.get(phoneDigits(String(c.phone))) ?? null : null }));
  return NextResponse.json({ ok: true, chats });
}

export async function POST(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const b = await req.json().catch(() => ({}));
  const action = ["send", "release", "status"].includes(b.action) ? b.action : "";
  const lead = String(b.lead || "");
  if (!action || !LEAD.test(lead)) return NextResponse.json({ ok: false }, { status: 400 });
  const text = String(b.text ?? "").trim().slice(0, 2000);
  if (action === "send" && !text) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await chatAdmin({ action, lead, text, status: b.status, note: b.note });
  if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });

  // a message the seller really sent makes the lead his (the phone is taken from the lead, never from the browser)
  if (action === "send" && r.ok !== false && access.seller) {
    let phone = /^\d+$/.test(lead) ? lead : "";
    if (!phone) {
      const list = await chatAdmin({ action: "list" });
      const hit = ((list?.chats as Record<string, unknown>[]) || []).find(c => c.lead === lead);
      phone = phoneDigits(String(hit?.phone || ""));
    }
    try { await recordTouch(createServerClient(), access.seller.email, lead, phone); } catch { /* the message went out either way */ }
  }
  return NextResponse.json(r);
}
