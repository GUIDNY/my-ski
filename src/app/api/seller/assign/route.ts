import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { phoneDigits } from "@/lib/sellers";
import { readSellerConfig, sellerData, sellersOf, updateSellerConfig } from "@/lib/seller-store";
import { allLeads, isTrashed, leadList, leadOwner } from "@/lib/seller-leads";
import { telegramSend } from "@/lib/telegram";
import { SITE } from "@/lib/site";

/*
 * Idan's lead assignment (/seller/assign and the lead card in /admin/chats):
 * GET  every lead with its owner, the sellers, and the auto-assign setting.
 * POST { leads: [id…] | lead: id, seller: email | "" (nobody) | "auto" (back to automatic) }
 *      { autoAssign: email | "" }  new leads from now on go to that seller (or stop)
 * A seller gets a Telegram message when a lead is assigned to him.
 */
export const dynamic = "force-dynamic";

const LEAD = /^(web_[A-Za-z0-9_-]{16,64}|\d{8,15}|m_[a-z0-9]{10})$/;

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  if (!access.isAdmin) return NextResponse.json({ error: "admins only" }, { status: 403 });
  const cfg = await readSellerConfig(createServerClient());
  const leads = await allLeads(cfg, true);
  if (!leads) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
  const rows = leads.filter(l => !isTrashed(cfg, l)).map(l => {
    const o = leadOwner(cfg, l);
    return {
      lead: l.lead, name: String(l.name || ""), phone: String(l.phone || ""), channel: String(l.channel || ""),
      firstAt: String(l.firstAt || ""), lastAt: String(l.lastAt || ""), lastMessage: String(l.lastMessage || ""),
      status: String(l.status || ""), quotes: Number(l.quotes) || 0, lastTotal: Number(l.lastTotal) || 0,
      owner: o.seller, by: o.by,
    };
  });
  return NextResponse.json({ ok: true, sellers: sellersOf(cfg), autoAssign: cfg.autoAssign ?? null, leads: rows });
}

export async function POST(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  if (!access.isAdmin) return NextResponse.json({ error: "admins only" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const db = createServerClient();
  const SELLERS = sellersOf(await readSellerConfig(db));

  if ("autoAssign" in b) {
    const email = String(b.autoAssign || "");
    if (email && !SELLERS.some(s => s.email === email)) return NextResponse.json({ ok: false }, { status: 400 });
    await updateSellerConfig(db, cfg => {
      if (email) cfg.autoAssign = { seller: email, since: new Date().toISOString() }; else delete cfg.autoAssign;
    });
    return NextResponse.json({ ok: true });
  }

  const ids: string[] = (Array.isArray(b.leads) ? b.leads : [b.lead]).map(String).filter((x: string) => LEAD.test(x)).slice(0, 200);
  const seller = String(b.seller ?? "");
  if (!ids.length || !(seller === "" || seller === "auto" || SELLERS.some(s => s.email === seller))) return NextResponse.json({ ok: false }, { status: 400 });

  const leads = await allLeads(await readSellerConfig(db)) ?? await leadList() ?? [];
  const byId = new Map(leads.map(l => [l.lead, l]));
  const now = new Date().toISOString();
  const cfg = await updateSellerConfig(db, c => {
    for (const id of ids) {
      if (seller === "auto") { delete c.leads[id]; continue; }
      const l = byId.get(id);
      c.leads[id] = { seller, phone: phoneDigits(String(l?.phone || (/^\d+$/.test(id) ? id : ""))), at: now };
    }
  });

  // tell him on Telegram (one message for a few, a summary for many)
  const chat = seller && seller !== "auto" ? sellerData(cfg, seller).telegram : undefined;
  if (chat) {
    const who = (id: string) => { const l = byId.get(id); return [String(l?.name || "").trim(), l?.phone ? `+${l.phone}` : ""].filter(Boolean).join(" · ") || "גולש באתר"; };
    const text = ids.length <= 3
      ? ids.map(id => `📌 שויך אליך ליד\n${who(id)}\n${SITE}/seller/chats?lead=${encodeURIComponent(id)}`).join("\n\n")
      : `📌 שויכו אליך ${ids.length} לידים\n${SITE}/seller/chats`;
    try { await telegramSend(chat, text); } catch { /* the assignment is saved either way */ }
  }
  return NextResponse.json({ ok: true, count: ids.length });
}
