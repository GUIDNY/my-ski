import type { PricingRule } from "@/lib/pricing";
import { placeOf, bedroomsOf } from "@/lib/residences";
import { aptText, amenitiesOf, isAgency, typeWorthShowing } from "./apartment-text";
import type { ListItem } from "./cards";
import type { Lang } from "./config";
import type { PublicApartment } from "./data";
import { DICT } from "./dict";
import { upcomingWeeks } from "./pricing-view";

const FALLBACK_IMG = "/apt1.jpg";

/** One card's worth of data per apartment, in this language (server: the translations stay here). */
export function buildItems(lang: Lang, apartments: PublicApartment[], rules: Record<string, PricingRule[]> | null, todayIso: string): ListItem[] {
  const t = DICT[lang].common;
  return apartments.map(a => {
    const agency = isAgency(a);
    const text = aptText(a, lang);
    const meta = [
      typeWorthShowing(text),
      a.max_guests ? t.upTo(Number(a.max_guests)) : "",
      a.sqm ? t.sqm(Number(a.sqm)) : "",
    ].filter(Boolean).join(" · ");
    const pl = placeOf(a), b = bedroomsOf(a);
    return {
      id: a.id,
      kind: agency ? "agency" : "own",
      name: text.name,
      meta: meta || t.valThorens,
      img: a.images?.[0] || FALLBACK_IMG,
      badge: agency ? t.agencyBadge : lang === "fr" ? "Arrivée tous les jours" : "Any check-in day",
      maxGuests: a.max_guests ? Number(a.max_guests) : null,
      price_per_night: Number(a.price_per_night) || 0,
      weeks: agency ? upcomingWeeks(a, todayIso) : [],
      rules: agency ? [] : (rules?.[a.id] ?? null),
      facts: {
        bed: b === "studio" ? "studio" : b >= 4 ? "4" : b ? String(b) : "",
        beds: b === "studio" ? 0 : b,
        residence: pl.residence, quarter: pl.quarter,
        sqm: a.sqm ? Number(a.sqm) : null,
        code: text.code ?? null,
        amen: amenitiesOf(a, lang),
      },
    };
  });
}
