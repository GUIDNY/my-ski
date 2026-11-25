import type { GearOrder } from "./gear";
import { GEAR_SHOP } from "./gear";

type Order = {
  code: string; customer_email?: string | null; customer_name?: string | null; customer_phone?: string | null;
  total_eur?: number | null; status?: string | null; ops?: Record<string, unknown> | null;
};

export const gearOf = (o: { ops?: Record<string, unknown> | null }) =>
  (o.ops && typeof o.ops.x_gear === "object" ? o.ops.x_gear as GearOrder : null);

/*
 * The equipment order email, in English (the shop reads it): the names, what
 * each person rents, the dates, and "show this at Caron Skishop". Built and
 * sent by the n8n booking-email workflow (type "gear"). Never throws.
 */
export async function sendGearEmail(order: Order, origin: string, paid: boolean): Promise<boolean> {
  const hook = process.env.N8N_WEBHOOK_URL;
  const gear = gearOf(order);
  if (!hook || !gear || !order.customer_email) return false;
  try {
    const r = await fetch(hook, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        type: "gear", order_code: order.code,
        order: {
          code: order.code, customer_email: order.customer_email, customer_name: order.customer_name,
          customer_phone: order.customer_phone, total_eur: order.total_eur, paid,
          logo: `${origin}/skishare-logo.png`,
        },
        gear: { ...gear, shop: GEAR_SHOP.name, shop_area: GEAR_SHOP.area, shop_maps: GEAR_SHOP.maps },
      }),
    });
    return r.ok;
  } catch { return false; }
}
