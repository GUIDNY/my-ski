import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { findProposal, orderFieldsFromProposal } from "@/lib/proposal-order";

/*
 * Admin: fill an order from the quote it was paid from (apartments, dates, people,
 * ski pass, transfer, equipment, flights), so the customer's personal area shows all of it.
 * The quote: the number in the order's name (SK-2026-0062), the one linked before, or the body's `number`.
 * The amount paid and the customer's details are kept; empty ones are filled from the quote.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const db = createServerClient();
  const { data: o } = await db.from("orders").select("*").eq("id", id).single();
  if (!o) return NextResponse.json({ error: "order not found" }, { status: 404 });
  const ops = (o.ops as Record<string, unknown>) || {};
  const number = String(b.number || "").trim().toUpperCase() || (String(o.apartment_name || "").match(/SK-\d{4}-\d{3,5}/)?.[0] ?? "");
  const p = await findProposal(db, { id: typeof ops.x_proposal === "string" ? ops.x_proposal : undefined, number: number || undefined });
  if (!p) return NextResponse.json({ error: "no_proposal", number }, { status: 404 });
  const q = await orderFieldsFromProposal(db, p);
  const share = /החלק של/.test(String(o.apartment_name || ""));
  const patch: Record<string, unknown> = {
    apartment_id: q.apartment_id ?? o.apartment_id,
    apartment_name: `${q.apartment_name || o.apartment_name}${p.proposal_number ? ` · ${p.proposal_number}` : ""}${share ? " · החלק של אדם אחד" : ""}`,
    extra_apartment_id: q.extra_apartment_id ?? o.extra_apartment_id,
    extra_apartment_name: q.extra_apartment_name ?? o.extra_apartment_name,
    checkin: q.checkin ?? o.checkin, checkout: q.checkout ?? o.checkout, nights: q.nights || o.nights,
    guests: q.guests || o.guests,
    ski_pass: q.ski_pass || o.ski_pass, transfer: q.transfer || o.transfer, equipment: q.equipment || o.equipment, flight: q.flight || o.flight,
    transfer_details: o.transfer_details || q.transfer_details, flight_details: o.flight_details || q.flight_details,
    customer_name: o.customer_name || q.clientName, customer_phone: o.customer_phone || q.clientPhone,
    customer_email: o.customer_email || q.clientEmail.toLowerCase(),
    // a flight already entered by hand (with the booking code) stays
    ops: { ...q.ops, ...ops, x_proposal: p.id, ...(ops.x_flight ? {} : q.ops.x_flight ? { x_flight: q.ops.x_flight } : {}), x_pass3v: ops.x_pass3v ?? q.ops.x_pass3v },
  };
  const { error } = await db.from("orders").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, proposal: p.proposal_number, filled: { apartments: [q.apartment_name, q.extra_apartment_name].filter(Boolean), ski_pass: q.ski_pass, transfer: q.transfer, equipment: q.equipment, flight: q.flight } });
}
