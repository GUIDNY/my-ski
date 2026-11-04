import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { phoneDigits } from "@/lib/sellers";
import { readSellerConfig, sellerData, sellersOf, updateSellerConfig } from "@/lib/seller-store";
import { sellerOrders } from "@/lib/seller-orders";
import { leadList, phoneOwners } from "@/lib/seller-leads";

/*
 * /seller/customers: his leads (assigned, written to, or automatic), everyone
 * who ordered through him, and customers he added himself — with a star and a
 * private note. An admin sees the customers of every seller.
 */
export const dynamic = "force-dynamic";

type Customer = {
  phone: string; name: string; seller: string; saved: boolean; note: string; addedAt: string;
  lead: string | null; channel: string | null; status: string | null; lastAt: string | null; lastMessage: string | null;
  orders: number; spent: number; share: number;
};

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const db = createServerClient();
  const leads = await leadList() ?? [];
  const { orders, cfg } = await sellerOrders(db, undefined, leads);
  const leadByPhone = new Map<string, Record<string, unknown>>();
  for (const l of leads) { const d = phoneDigits(String(l.phone || "")); if (d && !leadByPhone.has(d)) leadByPhone.set(d, l); }

  const emails = access.isAdmin ? sellersOf(cfg).map(s => s.email) : [access.seller!.email];
  const out = new Map<string, Customer>();
  const touch = (phone: string, seller: string, at: string, name = "") => {
    const key = phone || `?${name}`;
    const c = out.get(key) ?? { phone, name, seller, saved: false, note: "", addedAt: at, lead: null, channel: null, status: null, lastAt: null, lastMessage: null, orders: 0, spent: 0, share: 0 };
    if (!c.name && name) c.name = name;
    if (at && at < c.addedAt) c.addedAt = at;
    out.set(key, c);
    return c;
  };
  for (const email of emails) {
    const s = sellerData(cfg, email);
    for (const [phone, c] of Object.entries(s.customers)) {
      const row = touch(phone, email, c.at, c.name || "");
      row.saved = !!c.saved; row.note = c.note || "";
      if (c.name) row.name = c.name;
    }
  }
  for (const [phone, o] of phoneOwners(cfg, leads)) if (emails.includes(o.seller)) touch(phone, o.seller, o.since);
  for (const o of orders) {
    if (!o.owner || !emails.includes(o.owner)) continue;
    const c = touch(o.phone, o.owner, o.createdAt, o.customer);
    if (o.counts) { c.orders++; c.spent += o.total; c.share += o.share ?? 0; }
  }
  for (const c of out.values()) {
    const l = c.phone ? leadByPhone.get(c.phone) : undefined;
    if (!l) continue;
    if (!c.name) c.name = String(l.name || "").trim();
    c.lead = String(l.lead || ""); c.channel = String(l.channel || ""); c.status = String(l.status || "");
    c.lastAt = String(l.lastAt || ""); c.lastMessage = String(l.lastMessage || "");
  }
  const customers = [...out.values()].sort((a, b) => Number(b.saved) - Number(a.saved) || String(b.lastAt || b.addedAt).localeCompare(String(a.lastAt || a.addedAt)));
  return NextResponse.json({ ok: true, customers, canEdit: !!access.seller });
}

// { phone, name?, note?, saved? }: save or update one of the seller's customers (also adds a new one by hand)
export async function POST(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const b = await req.json().catch(() => ({}));
  const email = access.seller?.email ?? (access.isAdmin && sellersOf(await readSellerConfig(createServerClient())).some(s => s.email === b.seller) ? String(b.seller) : "");
  const phone = phoneDigits(b.phone);
  if (!email || phone.length < 9 || phone.length > 15) return NextResponse.json({ ok: false, error: "phone" }, { status: 400 });
  await updateSellerConfig(createServerClient(), cfg => {
    const s = sellerData(cfg, email);
    const c = { ...(s.customers[phone] ?? { at: new Date().toISOString() }) };
    if (typeof b.name === "string") c.name = b.name.trim().slice(0, 80);
    if (typeof b.note === "string") c.note = b.note.trim().slice(0, 1000);
    if (typeof b.saved === "boolean") c.saved = b.saved;
    s.customers[phone] = c;
    cfg.sellers[email] = s;
  });
  return NextResponse.json({ ok: true });
}
