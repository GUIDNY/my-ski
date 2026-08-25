import { createServerClient } from "@/lib/supabase-server";
import { createBooking } from "@/lib/winteride";
import { NextRequest, NextResponse } from "next/server";

// The ONLY route that creates a real, billable booking on the Winteride
// partner account. Only reachable from the admin panel — never called from
// the public-facing transfers form.
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = createServerClient();

  const { data: t, error } = await db.from("transfers").select("*").eq("id", id).single();
  if (error || !t) return NextResponse.json({ error: "transfer not found" }, { status: 404 });
  if (t.winteride_ref) return NextResponse.json({ error: "already booked with Winteride" }, { status: 409 });

  const legs: { direction: "outbound" | "return"; out_direction: "arrival" | "departure"; date: string | null; flight_no: string | null }[] = [];
  if (t.direction === "outbound" || t.direction === "both") {
    legs.push({ direction: "outbound", out_direction: "arrival", date: t.outbound_date, flight_no: t.outbound_flight });
  }
  if (t.direction === "return" || t.direction === "both") {
    legs.push({ direction: "return", out_direction: "departure", date: t.return_date, flight_no: t.return_flight });
  }
  if (!legs.length) return NextResponse.json({ error: "no legs to book" }, { status: 400 });

  const vehicleClass = t.vehicle_class_id ?? t.vehicle_class ?? "sedan";
  const bookings = [];
  try {
    for (const leg of legs) {
      if (!leg.date) throw new Error(`missing date for ${leg.direction} leg`);
      const booking = await createBooking({
        airport_code: t.airport,
        resort_slug: t.resort_slug ?? "val-thorens",
        date: leg.date,
        pax: t.passengers,
        out_direction: leg.out_direction,
        flight_no: leg.flight_no ?? undefined,
        chosen_class: vehicleClass,
        customer: { name: t.customer_name, phone: t.customer_phone ?? undefined, email: t.customer_email ?? undefined },
        luggage: t.luggage ?? undefined,
        ski: t.ski ?? undefined,
        supplements: Array.isArray(t.supplements) && t.supplements.length ? t.supplements : undefined,
      });
      bookings.push({ ...booking, leg: leg.direction });
    }
  } catch (e) {
    // Surface whatever legs already succeeded so nothing silently gets lost.
    return NextResponse.json({ error: e instanceof Error ? e.message : "booking failed", partial: bookings }, { status: 502 });
  }

  const { data: updated, error: updateError } = await db.from("transfers").update({
    status: "confirmed",
    winteride_ref: bookings.map(b => b.ref).join(", "),
    winteride_booking_id: bookings.map(b => b.booking_id).join(", "),
    winteride_status: bookings.map(b => b.status).join(", "),
  }).eq("id", id).select().single();

  if (updateError) return NextResponse.json({ error: updateError.message, bookings }, { status: 500 });
  return NextResponse.json({ transfer: updated, bookings });
}
