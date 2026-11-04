import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { chatAdmin } from "@/lib/helper-chat";
import { createServerClient } from "@/lib/supabase-server";
import { phoneDigits } from "@/lib/sellers";
import { readSellerConfig, recordTouch, updateSellerConfig } from "@/lib/seller-store";
import { leadList, leadOwner } from "@/lib/seller-leads";

/*
 * The seller's leads & chats (/seller/chats): the same screen and actions as
 * /admin/chats, but a seller gets his leads (lib/seller-leads: assigned by Idan,
 * written to by him, or auto-assigned) AND every lead nobody owns yet. Leads of
 * another seller are hidden. Writing to a free lead makes it his (first one wins).
 * An admin gets every lead, with its owner.
 */
export const dynamic = "force-dynamic";

const LEAD = /^(web_[A-Za-z0-9_-]{16,64}|\d{8,15})$/;

/** whose lead is it now: "mine", "free" (nobody's), or "other" (another seller's). Admins: always "mine". */
async function access2lead(access: { isAdmin: boolean; seller: { email: string } | null }, lead: string): Promise<"mine" | "free" | "other"> {
  if (access.isAdmin) return "mine";
  if (!access.seller) return "other";
  const [cfg, leads] = await Promise.all([readSellerConfig(createServerClient()), leadList()]);
  const owner = leadOwner(cfg, leads?.find(l => l.lead === lead) ?? { lead }).seller;
  return owner === access.seller.email ? "mine" : owner ? "other" : "free";
}

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const lead = req.nextUrl.searchParams.get("lead") || "";
  if (lead) {
    if (!LEAD.test(lead)) return NextResponse.json({ ok: false }, { status: 400 });
    if (await access2lead(access, lead) === "other") return NextResponse.json({ ok: false, error: "not your lead" }, { status: 403 });
    const r = await chatAdmin({ action: "thread", lead });
    if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
    return NextResponse.json(r);
  }
  const db = createServerClient();
  const [leads, cfg, { data: orders }] = await Promise.all([
    leadList(true), readSellerConfig(db),
    db.from("orders").select("code, customer_phone, total_eur, status, checkin, apartment_name, created_at")
      .in("status", ["approved", "hold"]).order("created_at", { ascending: false }).limit(500),
  ]);
  if (!leads) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
  const byPhone = new Map<string, { code: string; total: number; status: string; checkin: string | null; apartment: string }>();
  for (const o of orders ?? []) {
    const d = phoneDigits(o.customer_phone);
    if (d.length >= 9 && !byPhone.has(d)) byPhone.set(d, { code: o.code, total: Number(o.total_eur) || 0, status: o.status, checkin: o.checkin, apartment: o.apartment_name });
  }
  const chats = leads
    .map(c => ({ ...c, owner: leadOwner(cfg, c).seller, order: c.phone ? byPhone.get(phoneDigits(String(c.phone))) ?? null : null }))
    .filter(c => access.isAdmin || !c.owner || c.owner === access.seller?.email);
  return NextResponse.json({ ok: true, chats });
}

export async function POST(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const b = await req.json().catch(() => ({}));
  const action = ["send", "release", "status"].includes(b.action) ? b.action : "";
  const lead = String(b.lead || "");
  if (!action || !LEAD.test(lead)) return NextResponse.json({ ok: false }, { status: 400 });
  const whose = await access2lead(access, lead);
  if (whose === "other") return NextResponse.json({ ok: false, error: "not your lead" }, { status: 403 });
  // on a free lead a seller may only write (that takes it); status and handing back stay with the owner
  if (whose === "free" && action !== "send") return NextResponse.json({ ok: false, error: "answer first to take this lead" }, { status: 403 });
  const text = String(b.text ?? "").trim().slice(0, 2000);
  if (action === "send" && !text) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await chatAdmin({ action, lead, text, status: b.status, note: b.note });
  if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });

  // a message the seller really sent keeps the lead his (the phone is taken from the lead, never from the browser)
  if (action === "send" && r.ok !== false && access.seller) {
    let phone = /^\d+$/.test(lead) ? lead : "";
    if (!phone) phone = phoneDigits(String((await leadList())?.find(c => c.lead === lead)?.phone || ""));
    const db = createServerClient();
    try {
      await recordTouch(db, access.seller.email, lead, phone);
      // a free lead becomes his, even one Idan had set to "nobody" (first one to answer takes it)
      if (whose === "free") {
        const me = access.seller.email;
        await updateSellerConfig(db, cfg => { cfg.leads[lead] = { seller: me, phone, at: new Date().toISOString() }; });
      }
    } catch { /* the message went out either way */ }
  }
  return NextResponse.json(r);
}
