export type PricingRule = {
  id: string;
  label: string;
  type: string;        // "date_range" | "month" | "weekday"
  price_type: string;  // "absolute" | "add" | "subtract"
  start_date?: string;
  end_date?: string;
  months?: number[];
  weekdays?: number[];
  price: number;
  priority: number;
};

export function getEffectivePrice(date: Date, basePrice: number, rules: PricingRule[]): number {
  const sorted  = [...rules].sort((a, b) => b.priority - a.priority);
  const iso     = date.toISOString().split("T")[0];
  const wd      = date.getDay();
  const mo      = date.getMonth();

  const matches = (r: PricingRule) =>
    (r.type === "date_range" && !!r.start_date && !!r.end_date && iso >= r.start_date && iso <= r.end_date
      && (!r.weekdays || r.weekdays.length === 0 || r.weekdays.includes(wd))) ||
    (r.type === "month"      && !!r.months?.includes(mo)) ||
    (r.type === "weekday"    && !!r.weekdays?.includes(wd));

  /* Highest-priority absolute rule sets the base; then all delta rules stack */
  const absoluteRule = sorted.find(r => matches(r) && (r.price_type ?? "absolute") === "absolute");
  let price = absoluteRule ? absoluteRule.price : basePrice;

  for (const r of sorted) {
    if (!matches(r)) continue;
    if ((r.price_type ?? "absolute") === "add")      price += r.price;
    if ((r.price_type ?? "absolute") === "subtract") price -= r.price;
  }

  return Math.max(0, price);
}

export function calcTotalForRange(checkin: string, checkout: string, basePrice: number, rules: PricingRule[]): number {
  let total = 0;
  const start = new Date(checkin + "T12:00:00");
  const end   = new Date(checkout + "T12:00:00");
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1))
    total += getEffectivePrice(new Date(d), basePrice, rules);
  return total;
}
