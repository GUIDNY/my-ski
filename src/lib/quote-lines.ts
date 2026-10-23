import type { Apartment, SkiPass } from "@/types";
import { stayBreakdown, matchingWeek, skiDaysFromNights, equipCost, type PricingRule } from "@/lib/pricing";
import { TRANSFER_PRICE, BAGGAGE_PRICE, PASS_AREA_LABEL, liftsOpenForStay, passTier, type PassArea } from "@/lib/deal-pricing";
import type { QuoteExtras } from "@/lib/quote-extras";
import type { DirectFlight } from "@/lib/flight-format";

// flat choices, the same numbers as the apartment page
export const FLEXIBLE_EXTRA = 100;
export const NO_CANCEL_DISCOUNT = 100;
export const AI_DISCOUNT = 50;

export type QuoteLine = { key: string; label: string; sub?: string; amount: number };

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
export const nightsBetween = (ci: string, co: string) =>
  ci && co ? Math.max(Math.round((new Date(co + "T12:00:00").getTime() - new Date(ci + "T12:00:00").getTime()) / 86400000), 0) : 0;

export type QuoteInputs = {
  apt: Apartment | null;
  rules: PricingRule[];
  passes: SkiPass[];
  checkin: string;
  checkout: string;
  guests: number;
  /** what was picked (see quote-extras.ts) */
  extras: QuoteExtras;
  cancel: string;
  service: string;
  /** the direct flight for the dates, when there is one */
  flight: DirectFlight | null;
  /** the stored apartment total, used only when the apartment can't be priced again */
  fallbackAptTotal?: number;
};

/**
 * Every line of a quote and its total, from live data: the apartment the way
 * the apartment page prices it (the La Cime week, or the nights + cleaning
 * from the Airbnb calendar), the real ski-pass tiers, the flat add-ons, and
 * a flight only when there is a direct one. The quote page and its PDF both
 * use this, so they always agree.
 */
export function quoteLines(i: QuoteInputs) {
  const nights = nightsBetween(i.checkin, i.checkout);
  const skiDays = skiDaysFromNights(nights);
  const week = i.apt ? matchingWeek(i.apt, i.checkin, i.checkout) : null;
  const stay = i.apt && !week && nights > 0 && i.apt.source !== "la_cime"
    ? stayBreakdown(i.checkin, i.checkout, Number(i.apt.price_per_night || 0), i.rules) : null;
  const aptTotal = week ? week.price : stay ? stay.total : (i.fallbackAptTotal ?? 0);
  const cleaningFee = stay?.fee ?? 0;

  const lines: QuoteLine[] = [{
    key: "stay",
    label: week ? "לינה, שבוע שלם (שבת עד שבת)" : `לינה, ${nights} ${nights === 1 ? "לילה" : "לילות"}${cleaningFee > 0 ? ", כולל ניקיון" : ""}`,
    sub: stay && nights > 0 ? `${eur(Math.round((aptTotal - cleaningFee) / nights))} בממוצע ללילה${cleaningFee > 0 ? ` + ${eur(cleaningFee)} ניקיון` : ""}` : undefined,
    amount: aptTotal,
  }];

  const x = i.extras;
  let passArea: PassArea | null = null;
  if (x.pass && liftsOpenForStay(x.pass.area, i.checkin, i.checkout)) {
    const tier = passTier(i.passes, x.pass.area, skiDays);
    if (tier) {
      passArea = x.pass.area;
      lines.push({ key: "pass", label: `סקי פס ${PASS_AREA_LABEL[x.pass.area]} × ${x.pass.qty}`, sub: `${tier.duration_days} ימים · ${eur(tier.price)} לאדם`, amount: tier.price * x.pass.qty });
    }
  }
  if (x.transfer) lines.push({ key: "transfer", label: `הסעה הלוך וחזור × ${x.transfer.qty}`, sub: `שאטל מהשדה עד הדירה · ${eur(TRANSFER_PRICE)} לאדם`, amount: TRANSFER_PRICE * x.transfer.qty });
  if (x.equipment && skiDays > 0) {
    const unit = equipCost(skiDays);
    lines.push({ key: "equipment", label: `ציוד סקי או סנובורד × ${x.equipment.qty}`, sub: `${skiDays} ימי גלישה · ${eur(unit)} לאדם`, amount: unit * x.equipment.qty });
  }
  if (x.flight && i.flight) {
    lines.push({ key: "flight", label: `טיסה ישירה הלוך וחזור ל${i.flight.city} × ${x.flight.qty}`, sub: `${i.flight.airline ? `${i.flight.airline} · ` : ""}${eur(i.flight.price)} לאדם`, amount: i.flight.price * x.flight.qty });
    if (x.bag) lines.push({ key: "bag", label: `מזוודה לבטן × ${x.bag.qty}`, sub: `הלוך וחזור · ${eur(BAGGAGE_PRICE)} לאדם`, amount: BAGGAGE_PRICE * x.bag.qty });
  }
  if (i.cancel === "flexible") lines.push({ key: "flex", label: "ביטול גמיש", amount: FLEXIBLE_EXTRA });
  if (i.cancel === "none") lines.push({ key: "nocancel", label: "בלי אפשרות ביטול", amount: -NO_CANCEL_DISCOUNT });
  if (i.service === "ai") lines.push({ key: "ai", label: "הנחת שירות AI", amount: -AI_DISCOUNT });

  const total = lines.reduce((s, l) => s + l.amount, 0);
  const guests = Math.max(i.guests || 1, 1);
  return { lines, total, perPerson: Math.round(total / guests), nights, skiDays, aptTotal, cleaningFee, weekly: !!week, stay, passArea };
}
