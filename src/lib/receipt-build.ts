import type { ReceiptDraft } from "@/lib/morning";

type OrderRow = {
  code?: string | null; customer_name?: string | null; customer_phone?: string | null;
  apartment_name?: string | null; extra_apartment_name?: string | null;
  checkin?: string | null; checkout?: string | null; nights?: number | null; guests?: number | null;
  ski_pass?: boolean | null; transfer?: boolean | null; equipment?: boolean | null; flight?: boolean | null;
  amount_ils?: number | null; total_eur?: number | null; payplus_transaction_uid?: string | null;
  ops?: Record<string, unknown> | null;
};

const dm = (d: string | null | undefined) => d ? `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}.${d.slice(0, 4)}` : "";

/** תיאור תכולת המסמך — what the deal included, from the order itself */
export function dealDescription(o: OrderRow): string {
  const parts: string[] = ["חופשת סקי בוואל טורנס"];
  if (o.apartment_name) parts.push(`לינה: ${String(o.apartment_name).slice(0, 60)}${o.extra_apartment_name ? ` + ${String(o.extra_apartment_name).slice(0, 40)}` : ""}`);
  if (o.checkin) parts.push(`${dm(o.checkin)}–${dm(o.checkout)} (${o.nights} לילות, ${o.guests} אורחים)`);
  const incl: string[] = [];
  if (o.ski_pass) incl.push("סקי פס");
  if (o.transfer) incl.push("הסעות משדה התעופה");
  if (o.equipment) incl.push("השכרת ציוד סקי");
  if (o.flight) incl.push("טיסות");
  if (incl.length) parts.push(`כולל: ${incl.join(", ")}`);
  return parts.join(" · ").slice(0, 250);
}

/** a ReceiptDraft for one payer of an order; b can override name/amount/currency/method */
export function receiptDraftFromOrder(o: OrderRow, b: { clientName?: unknown; amount?: unknown; currency?: unknown; payMethod?: unknown } = {}): ReceiptDraft {
  const ils = Number(o.amount_ils) > 0;
  const ops = (o.ops as Record<string, unknown>) || {};
  return {
    clientName: String(b.clientName || "").trim() || String(o.customer_name || "").trim() || "לקוח/ה",
    clientPhone: String(o.customer_phone || "").trim() || undefined,
    amount: Number(b.amount) > 0 ? Number(b.amount) : ils ? Number(o.amount_ils) : Number(o.total_eur) || 0,
    currency: (b.currency === "EUR" || b.currency === "ILS" ? b.currency : ils ? "ILS" : "EUR") as "ILS" | "EUR",
    payMethod: String(b.payMethod || ops.x_paymethod || "card_link"),
    description: dealDescription(o),
    remarks: `הזמנה ${o.code} · skisharebook.com`,
  };
}
