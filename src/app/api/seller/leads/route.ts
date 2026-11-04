import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { phoneDigits } from "@/lib/sellers";
import { readSellerConfig, sellersOf, updateSellerConfig } from "@/lib/seller-store";
import { israelStamp, leadList, leadOwner, newManualId } from "@/lib/seller-leads";

/*
 * "+ ליד חדש": a lead added by hand (a phone call, a referral, someone at the shop).
 * POST { name, phone, note?, seller? }  → { ok, lead }
 * A seller's new lead is his; Idan can pick a seller or leave it free.
 * A phone that already talks to the bot (or was added before) is not added twice:
 * the answer is that lead, so the screen opens it.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const b = await req.json().catch(() => ({}));
  const phone = phoneDigits(b.phone);
  const name = String(b.name ?? "").trim().slice(0, 80);
  const note = String(b.note ?? "").trim().slice(0, 1000);
  if (phone.length < 9 || phone.length > 15) return NextResponse.json({ ok: false, error: "phone" }, { status: 400 });
  const db = createServerClient();
  const cfg = await readSellerConfig(db);

  // already a lead? open that one (and a free one he adds becomes his)
  const n8n = (await leadList(true)) ?? [];
  const known = n8n.find(l => phoneDigits(String(l.phone || "")) === phone)
    ?? Object.entries(cfg.manualLeads).map(([id, m]) => ({ lead: id, phone: m.phone, firstAt: m.firstAt })).find(l => l.phone === phone);
  const me = access.seller?.email ?? "";
  const pick = access.isAdmin ? (sellersOf(cfg).some(s => s.email === b.seller) ? String(b.seller) : "") : me;
  if (known) {
    const owner = leadOwner(cfg, known).seller;
    if (pick && !owner) await updateSellerConfig(db, c => { c.leads[known.lead] = { seller: pick, phone, at: new Date().toISOString() }; });
    if (!access.isAdmin && owner && owner !== me) return NextResponse.json({ ok: false, error: "taken" }, { status: 409 });
    return NextResponse.json({ ok: true, lead: known.lead, existing: true });
  }

  const id = newManualId();
  const now = israelStamp();
  await updateSellerConfig(db, c => {
    c.manualLeads[id] = { name, phone, note, status: "talking", by: me || "admin", firstAt: now, lastAt: now };
    if (pick) c.leads[id] = { seller: pick, phone, at: new Date().toISOString() };
  });
  return NextResponse.json({ ok: true, lead: id });
}
