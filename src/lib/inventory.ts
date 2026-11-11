import type { SupabaseClient } from "@supabase/supabase-js";
import { getAirbnbCalendar } from "@/lib/airbnb-calendar";
import { airbnbClosedApartments } from "@/lib/airbnb-rules";

type OrderLike = {
  apartment_id?: string | null;
  extra_apartment_id?: string | null;
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

/**
 * Apartments that can't take a stay of checkin..checkout: any taken night in
 * the range (Airbnb/Hostex iCal, site orders and manual owner blocks all live
 * in availability_blocks) or a non-cancelled direct booking overlapping it,
 * plus nights already closed on the apartment's live Airbnb calendar (the
 * daily iCal sync can lag behind). Same rule as /search and the quote bots.
 * Returns null when a query
 * fails, so a caller can tell "nothing is taken" from "couldn't check".
 */
export async function takenApartmentIds(db: SupabaseClient, checkin: string, checkout: string): Promise<Set<string> | null> {
  const taken = new Set<string>();
  // PostgREST caps a response at 1000 rows; a long stay across many
  // apartments can pass that, so page through the blocks.
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("availability_blocks")
      .select("apartment_id")
      .gte("date", checkin).lt("date", checkout)
      .order("apartment_id").order("date")
      .range(from, from + PAGE - 1);
    if (error) return null;
    for (const r of data ?? []) if (r.apartment_id) taken.add(r.apartment_id);
    if (!data || data.length < PAGE) break;
  }
  const { data: bookings, error } = await db.from("bookings")
    .select("apartment_id")
    .neq("status", "cancelled")
    .lt("check_in", checkout).gt("check_out", checkin);
  if (error) return null;
  for (const r of bookings ?? []) if (r.apartment_id) taken.add(r.apartment_id);
  for (const id of airbnbClosedApartments(await getAirbnbCalendar(), checkin, checkout)) taken.add(id);
  return taken;
}

/** Block all nights of an order on the apartment calendar (both apartments if it's a combo). */
export async function blockDatesForOrder(db: SupabaseClient, order: OrderLike) {
  if (!order.checkin || !order.checkout) return;
  const aptIds = [order.apartment_id, order.extra_apartment_id].filter(Boolean) as string[];
  const nights = nightsBetween(order.checkin, order.checkout);
  const rows = aptIds.flatMap(apartment_id => nights.map(date => ({
    apartment_id,
    date,
    status: "booked",
    note: order.code ? `הזמנה ${order.code}` : "הזמנה",
    source: "order",
  })));
  if (rows.length) {
    try { await db.from("availability_blocks").upsert(rows, { onConflict: "apartment_id,date" }); } catch { /* ignore */ }
  }
}

/**
 * Free the dates an order had reserved (only blocks created by this order; both apartments),
 * then put back the nights that another active order still holds. A night's block carries
 * the code of the last order that wrote it, so with several orders on the same nights (a
 * group: every friend's payment is its own order) cancelling or deleting one used to free
 * the nights of all of them: an approved booking open again on the site and on Airbnb.
 */
export async function freeDatesForOrder(db: SupabaseClient, order: OrderLike) {
  if (!order.code) return;
  const aptIds = [order.apartment_id, order.extra_apartment_id].filter(Boolean) as string[];
  for (const apartment_id of aptIds) {
    try {
      await db.from("availability_blocks")
        .delete()
        .eq("apartment_id", apartment_id)
        .eq("source", "order")
        .eq("note", `הזמנה ${order.code}`);
    } catch { /* ignore */ }
  }
  if (order.checkin && order.checkout && aptIds.length) await reblockActiveOrders(db, { apartmentIds: aptIds, from: order.checkin, to: order.checkout, except: order.code });
}

/**
 * Block again the nights of every active order (approved / deposit held), optionally only
 * for some apartments and dates. Idempotent; runs after a release and once a day, so a
 * night that went missing for any reason is closed again on the site and in the feed
 * Airbnb/Hostex read.
 */
export async function reblockActiveOrders(db: SupabaseClient, opts: { apartmentIds?: string[]; from?: string; to?: string; except?: string } = {}): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  let q = db.from("orders").select("code, apartment_id, extra_apartment_id, checkin, checkout, status")
    .in("status", ["approved", "hold"]).not("checkin", "is", null).not("checkout", "is", null)
    .gt("checkout", opts.from && opts.from > today ? opts.from : today);
  if (opts.to) q = q.lt("checkin", opts.to);
  const { data, error } = await q;
  if (error || !data) return 0;
  let n = 0;
  for (const o of data) {
    if (opts.except && o.code === opts.except) continue;
    if (opts.apartmentIds && ![o.apartment_id, o.extra_apartment_id].some(id => id && opts.apartmentIds!.includes(id))) continue;
    await blockDatesForOrder(db, o);
    n++;
  }
  return n;
}
