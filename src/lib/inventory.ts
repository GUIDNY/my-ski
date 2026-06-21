import type { SupabaseClient } from "@supabase/supabase-js";

type OrderLike = {
  apartment_id?: string | null;
  checkin?: string | null;
  checkout?: string | null;
  code?: string;
};

// nights = checkin .. checkout-1 (checkout day is free for the next guest)
function nightsBetween(checkin: string, checkout: string): string[] {
  const out: string[] = [];
  const end = new Date(checkout + "T12:00:00");
  for (let d = new Date(checkin + "T12:00:00"); d < end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Block all nights of an order on the apartment's availability calendar. */
export async function blockDatesForOrder(db: SupabaseClient, order: OrderLike) {
  if (!order.apartment_id || !order.checkin || !order.checkout) return;
  const rows = nightsBetween(order.checkin, order.checkout).map(date => ({
    apartment_id: order.apartment_id,
    date,
    status: "booked",
    note: order.code ? `הזמנה ${order.code}` : "הזמנה",
    source: "order",
  }));
  if (rows.length) {
    try { await db.from("availability_blocks").upsert(rows, { onConflict: "apartment_id,date" }); } catch { /* ignore */ }
  }
}

/** Free the dates an order had reserved (only blocks created by this order). */
export async function freeDatesForOrder(db: SupabaseClient, order: OrderLike) {
  if (!order.apartment_id || !order.code) return;
  try {
    await db.from("availability_blocks")
      .delete()
      .eq("apartment_id", order.apartment_id)
      .eq("source", "order")
      .eq("note", `הזמנה ${order.code}`);
  } catch { /* ignore */ }
}
