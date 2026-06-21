import { createServerClient } from "@/lib/supabase-server";
import { blockDatesForOrder, freeDatesForOrder } from "@/lib/inventory";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = createServerClient();
  const { id } = await params;
  const body = await req.json();
  const { data, error } = await db.from("orders").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // inventory: cancel → free dates · approve/hold → reserve dates
  if (data) {
    if (body.status === "cancelled") await freeDatesForOrder(db, data);
    else if (body.status === "approved" || body.status === "hold") await blockDatesForOrder(db, data);
  }

  // when an order is approved → fire the "confirmed" email via n8n
  if (body.status === "approved" && data) {
    const hook = process.env.N8N_WEBHOOK_URL;
    if (hook) {
      const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
      try {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "order_approved",
            type: "approved",
            order: {
              code: data.code,
              customer_name: data.customer_name,
              customer_email: data.customer_email,
              apartment: data.apartment_name,
              area: data.area,
              checkin: data.checkin,
              checkout: data.checkout,
              guests: data.guests,
              nights: data.nights,
              ski_pass: data.ski_pass,
              transfer: data.transfer,
              total_eur: data.total_eur,
              portal_url: `${origin}/my?code=${data.code}`,
            },
          }),
        });
      } catch { /* ignore */ }
    }
  }
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = createServerClient();
  const { id } = await params;
  const { data: order } = await db.from("orders").select("apartment_id, code").eq("id", id).single();
  if (order) await freeDatesForOrder(db, order);
  const { error } = await db.from("orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
