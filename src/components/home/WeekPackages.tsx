import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { takenApartmentIds } from "@/lib/inventory";
import { rulesWithAirbnb } from "@/lib/airbnb-calendar";
import { equipCost, matchingWeek, skiDaysFromNights, stayBreakdown } from "@/lib/pricing";
import { skiPassPerPersonForWeek, TRANSFER_PRICE } from "@/lib/deal-pricing";
import type { Apartment, SkiPass } from "@/types";

/**
 * Homepage packages: real prices for one upcoming Saturday-to-Saturday week
 * (the first one with enough free apartments), for 4 adults — the apartment
 * exactly as the rest of the site prices it (Airbnb nights + cleaning for our
 * own, the week price for La Cime) plus a Trois Vallées pass, the airport
 * transfer and equipment for each person. No invented numbers.
 */

const GUESTS = 4;
const NIGHTS = 7;
const FIRST_WEEK = "2026-12-05"; // the whole 3 Vallées area opens on 5.12.2026
const LAST_WEEK = "2027-04-10";  // last full week before it closes on 18.4.2027 (the package has a 3V pass)
const APT_FIELDS = "id,name,price_per_night,max_guests,beds,sqm,images,source,available_weeks,available";
const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => { const d = new Date(s + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

function weekLabel(ci: string, co: string): string {
  const a = new Date(ci + "T12:00:00Z"), b = new Date(co + "T12:00:00Z");
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${a.getUTCDate()}\u2060–\u2060${b.getUTCDate()} ב${HE_MONTHS[b.getUTCMonth()]}` // "12–19" stays on one line
    : `${a.getUTCDate()} ב${HE_MONTHS[a.getUTCMonth()]} – ${b.getUTCDate()} ב${HE_MONTHS[b.getUTCMonth()]}`;
}

function candidateWeeks(): string[] {
  let start = addDays(iso(new Date()), 10);
  if (start < FIRST_WEEK) start = FIRST_WEEK;
  const d = new Date(start + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7)); // next Saturday
  const out: string[] = [];
  for (let s = iso(d); s <= LAST_WEEK && out.length < 8; s = addDays(s, 7)) out.push(s);
  return out;
}

type Card = {
  id: string; name: string; img: string; ownApartment: boolean; meta: string;
  href: string; perPerson: number; total: number;
};

async function loadPackages(): Promise<{ label: string; cards: Card[] } | null> {
  const db = createServerClient();
  const [{ data: apts, error }, { data: passes }] = await Promise.all([
    db.from("apartments").select(APT_FIELDS).eq("available", true),
    db.from("ski_passes").select("*").eq("available", true).eq("type", "adult").eq("area", "trois_vallees").order("duration_days", { ascending: true }),
  ]);
  if (error || !apts?.length) return null;
  const skiPass = skiPassPerPersonForWeek(passes as SkiPass[] | null);
  if (!skiPass) return null;
  const addOnsPerPerson = skiPass + TRANSFER_PRICE + equipCost(skiDaysFromNights(NIGHTS));
  const fits = (apts as Apartment[]).filter(a => (a.max_guests ?? 0) >= GUESTS);

  // The first week with at least 2 of our own apartments free (and 4 options
  // in all); failing that, the first week with 3 options.
  let pick: { checkin: string; checkout: string; own: Apartment[]; agency: Apartment[] } | null = null;
  for (const checkin of candidateWeeks()) {
    const checkout = addDays(checkin, NIGHTS);
    const taken = await takenApartmentIds(db, checkin, checkout);
    if (!taken) return null;
    const free = fits.filter(a => !taken.has(a.id));
    const own = free.filter(a => a.source !== "la_cime");
    const agency = free.filter(a => a.source === "la_cime" && matchingWeek(a, checkin, checkout));
    if (own.length >= 2 && own.length + agency.length >= 4) { pick = { checkin, checkout, own, agency }; break; }
    if (!pick && own.length + agency.length >= 3) pick = { checkin, checkout, own, agency };
  }
  if (!pick) return null;
  {
    const { checkin, checkout, own, agency } = pick;
    const rules = await rulesWithAirbnb(db, own.map(a => a.id));
    if (!rules) return null;
    const card = (a: Apartment, lodging: number): Card => {
      const total = Math.round(lodging) + GUESTS * addOnsPerPerson;
      // (beds is the number of beds, not bedrooms, so it isn't shown here)
      const meta = [`עד ${a.max_guests} אנשים`, a.sqm ? `${a.sqm} מ"ר` : ""].filter(Boolean).join(" · ");
      return {
        id: a.id, name: a.name, img: a.images?.[0] ?? "/hero-ski.jpg", ownApartment: a.source !== "la_cime", meta,
        // the apartment page opens with the same package (3V pass, transfer, gear) as this card's price
        href: `/apartments/${a.id}?checkin=${checkin}&checkout=${checkout}&guests=${GUESTS}&pass=trois_vallees&transfer=1&equip=1`,
        perPerson: Math.round(total / GUESTS), total,
      };
    };
    const ownCards = own
      .map(a => card(a, stayBreakdown(checkin, checkout, Number(a.price_per_night) || 0, rules.get(a.id) ?? []).total))
      .filter(c => c.total > GUESTS * addOnsPerPerson)
      .sort((x, y) => x.perPerson - y.perPerson);
    const agencyCards = agency
      .map(a => card(a, Number(matchingWeek(a, checkin, checkout)?.price) || 0))
      .filter(c => c.total > GUESTS * addOnsPerPerson)
      .sort((x, y) => x.perPerson - y.perPerson);
    // up to 3 of ours, the rest (at least one) from the agency, 4 cards in all
    const ownTop = ownCards.slice(0, agencyCards.length ? 3 : 4);
    const cards = [...ownTop, ...agencyCards.slice(0, Math.max(1, 4 - ownTop.length))]
      .slice(0, 4)
      .sort((x, y) => x.perPerson - y.perPerson);
    return cards.length >= 2 ? { label: weekLabel(checkin, checkout), cards } : null;
  }
}

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F7A4F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4 10-10" /></svg>
);

export default async function WeekPackages() {
  const data = await loadPackages().catch(() => null);
  if (!data) return null;
  return (
    <section className="max-w-[1240px] mx-auto px-5 md:px-6 py-14 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7 md:mb-9">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[28px] md:text-[40px] font-bold tracking-tight text-[#0B1B33]">חבילות סקי לשבוע {data.label}</h2>
          <p className="text-[15px] md:text-[17px] text-[#51607A]">לדוגמה ל-4 מבוגרים: 7 לילות, סקי פס לשלושת העמקים, הסעה מהשדה וציוד. בחרו תאריכים אחרים בחיפוש למעלה.</p>
        </div>
        <Link href="/search?deal=full" className="font-bold text-[16px] md:text-[17px] text-[#1652F0] hover:text-[#0E3FC2]">לכל החבילות ←</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {data.cards.map((c, i) => (
          <article key={c.id} className="bg-white border border-[#E3E9F2] rounded-[22px] overflow-hidden flex flex-col">
            <div className="relative h-[210px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
              <span className="absolute top-3.5 right-3.5 bg-white text-[#0B1B33] rounded-full px-3 py-1 text-[13px] font-bold">
                {c.ownApartment ? "דירה שלנו" : "שבת עד שבת"}
              </span>
              {i === 0 && (
                <span className="absolute top-3.5 left-3.5 bg-[#0B1B33] text-white rounded-full px-3 py-1 text-[13px] font-bold">הכי משתלם השבוע</span>
              )}
            </div>
            <div className="p-5 flex flex-col gap-2.5 flex-1">
              <h3 className="font-display text-[21px] font-bold text-[#0B1B33]">{c.name}</h3>
              <div className="text-[15px] text-[#51607A]">ואל טורנס · {c.meta}</div>
              <ul className="flex flex-col gap-1.5 text-[15px] text-[#0B1B33]">
                <li className="flex items-center gap-2"><Check />סקי פס לשלושת העמקים</li>
                <li className="flex items-center gap-2"><Check />הסעה וציוד לכולם</li>
              </ul>
              <div className="mt-auto pt-3.5 border-t border-[#E3E9F2]">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-extrabold text-[30px] text-[#0B1B33]">{eur(c.perPerson)}</span>
                  <span className="text-[15px] text-[#51607A]">לאדם</span>
                </div>
                <div className="text-[14px] text-[#51607A]">{eur(c.total)} לכל החבורה</div>
              </div>
              <Link href={c.href} className="mt-1.5 flex items-center justify-center min-h-[48px] rounded-[14px] bg-[#1652F0] hover:bg-[#0E3FC2] text-white font-bold text-[17px] transition-colors">לחבילה</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function WeekPackagesSkeleton() {
  return (
    <section className="max-w-[1240px] mx-auto px-5 md:px-6 py-14 md:py-20" aria-busy="true" aria-label="טוען חבילות">
      <div className="h-10 w-72 rounded-xl bg-[#EEF2F7] mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="border border-[#E3E9F2] rounded-[22px] overflow-hidden">
            <div className="h-[210px] bg-[#EEF2F7]" />
            <div className="p-5 flex flex-col gap-3">
              <div className="h-6 w-32 rounded-lg bg-[#EEF2F7]" />
              <div className="h-4 w-44 rounded-lg bg-[#F3F6FA]" />
              <div className="h-8 w-28 rounded-lg bg-[#EEF2F7] mt-4" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
