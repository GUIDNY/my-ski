// Price-table math for branded proposals.
// Discount is entered as a NEGATIVE number; VAT is an optional rate (e.g. 0.17).
export type LineItem = { label: string; qty: number; unitPrice: number };

export type Totals = {
  subtotal: number;      // sum of qty × unitPrice
  discount: number;      // as entered (≤ 0)
  afterDiscount: number; // subtotal + discount
  vat: number;           // afterDiscount × vatRate, rounded
  total: number;         // afterDiscount + vat
};

export function computeTotals(items: LineItem[], discount = 0, vatRate = 0): Totals {
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
  const afterDiscount = subtotal + (Number(discount) || 0);
  const vat = vatRate > 0 ? Math.round(afterDiscount * vatRate) : 0;
  const total = afterDiscount + vat;
  return { subtotal, discount: Number(discount) || 0, afterDiscount, vat, total };
}

export function money(n: number, currency = "EUR"): string {
  const sym = currency === "ILS" ? "₪" : currency === "USD" ? "$" : "€";
  const neg = n < 0;
  return `${neg ? "−" : ""}${sym}${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}
