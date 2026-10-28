import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { chatAdmin } from "@/lib/helper-chat";
import { createServerClient } from "@/lib/supabase-server";

/*
 * Admin leads & chats (/admin/chats): every lead from the site chat and WhatsApp
 * (n8n table "SkiShare WhatsApp leads"), its conversation, Idan writing to the
 * customer (site chat or WhatsApp; the bot then stays quiet in that chat),
 * handing it back, the lead's status and a note. Orders on the site with the same
 * phone mark the lead as closed ("won").
 */
export const dynamic = "force-dynamic";

const LEAD = /^(web_[A-Za-z0-9_-]{16,64}|\d{8,15})$/;
const digits = (s: string) => {
  let d = String(s || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (/^05\d{8}$/.test(d)) d = "972" + d.slice(1);
  return d;
};

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const lead = req.nextUrl.searchParams.get("lead") || (req.nextUrl.searchParams.get("sessionId") ? `web_${req.nextUrl.searchParams.get("sessionId")}` : "");
  if (lead) {
    if (!LEAD.test(lead)) return NextResponse.json({ ok: false }, { status: 400 });
    const r = await chatAdmin({ action: "thread", lead });
    if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
    return NextResponse.json(r);
  }
  const [r, { data: orders }] = await Promise.all([
    chatAdmin({ action: "list" }),
    createServerClient().from("orders").select("code, customer_name, customer_phone, total_eur, status, checkin, apartment_name, created_at")
      .in("status", ["approved", "hold"]).order("created_at", { ascending: false }).limit(500),
  ]);
  if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
  const byPhone = new Map<string, { code: string; total: number; status: string; checkin: string | null; apartment: string }>();
  for (const o of orders ?? []) {
    const d = digits(o.customer_phone || "");
    if (d.length >= 9 && !byPhone.has(d)) byPhone.set(d, { code: o.code, total: Number(o.total_eur) || 0, status: o.status, checkin: o.checkin, apartment: o.apartment_name });
  }
  const chats = ((r.chats as Record<string, unknown>[]) || []).map(c => {
    const order = c.phone ? byPhone.get(digits(String(c.phone))) ?? null : null;
    return { ...c, order };
  });
  return NextResponse.json({ ok: true, chats });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const action = ["send", "release", "status"].includes(b.action) ? b.action : "";
  const lead = String(b.lead || (b.sessionId ? `web_${b.sessionId}` : ""));
  if (!action || !LEAD.test(lead)) return NextResponse.json({ ok: false }, { status: 400 });
  const text = String(b.text ?? "").trim().slice(0, 2000);
  if (action === "send" && !text) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await chatAdmin({ action, lead, text, status: b.status, note: b.note });
  if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
  return NextResponse.json(r);
}
