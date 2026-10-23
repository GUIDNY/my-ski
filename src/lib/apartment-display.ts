import type { Apartment } from "@/types";

/*
 * How an apartment is named to people and search engines. Agency listings
 * are stored as "סטודיו — NV0153" (the agency's code), which tells nobody
 * anything; ours as "נבס 154". The stored name stays as it is (quotes,
 * payments, WhatsApp and the admin use it); these are only for showing.
 */
type AptLike = Pick<Apartment, "name" | "type" | "source" | "max_guests" | "sqm"> & { available_weeks?: Apartment["available_weeks"] };

const isAgency = (a: Pick<Apartment, "source">) => a.source === "la_cime";

/** the agency's code ("NV0153") and building name ("Résidence Sérac") inside the stored name */
export function aptParts(a: Pick<Apartment, "name">) {
  const parts = a.name.split(/\s+[—–-]\s+/).map(p => p.trim()).filter(Boolean);
  const code = parts.find(p => /^[A-Z0-9]{4,8}$/.test(p) && /\d/.test(p)) ?? null;
  const residence = parts.find(p => /[A-Za-zÀ-ÿ]/.test(p) && /\s/.test(p) && !/[א-ת]/.test(p)) ?? null;
  return { code, residence };
}

/** "סטודיו", "דירת 2 חדרים", or "דירה" */
export function aptKind(a: Pick<Apartment, "type">) {
  const t = (a.type || "").trim();
  if (t === "סטודיו") return "סטודיו";
  const rooms = t.match(/^(\d+)\s*חדרים$/);
  return rooms ? `דירת ${rooms[1]} חדרים` : "דירה";
}

/** "לזוג" / "ל-4 אנשים" */
export const forWho = (n?: number | null) => (!n ? "" : n === 2 ? "לזוג" : `ל-${n} אנשים`);

/**
 * The name to show, without the place: "סטודיו ל-4 אנשים · Résidence Sérac"
 * (agency) or the stored name (ours: "נבס 154").
 */
export function aptShortName(a: AptLike) {
  if (!isAgency(a)) return a.name;
  const { residence } = aptParts(a);
  const who = forWho(a.max_guests);
  return `${aptKind(a)}${who ? ` ${who}` : ""}${residence ? ` · ${residence}` : ""}`;
}

/**
 * The full name, for the page heading, the title and structured data:
 * "סטודיו ל-4 אנשים בואל טורנס · 25 מ״ר" (agency) or
 * "נבס 154 · דירה ל-4 אנשים בואל טורנס" (ours; our sizes aren't all
 * measured, so they stay out of the name).
 */
export function aptDisplayName(a: AptLike) {
  const who = forWho(a.max_guests);
  if (!isAgency(a)) return `${a.name} · ${aptKind(a)}${who ? ` ${who}` : ""} בואל טורנס`;
  const { residence } = aptParts(a);
  const size = a.sqm ? ` · ${a.sqm} מ״ר` : "";
  return `${aptKind(a)}${who ? ` ${who}` : ""} בואל טורנס${size}${residence ? ` · ${residence}` : ""}`;
}

/** the cheapest week still ahead (agency apartments are rented by the week) */
export function minWeekPrice(a: Pick<Apartment, "available_weeks">, todayISO = new Date().toISOString().slice(0, 10)) {
  const weeks = (a.available_weeks ?? []).filter(w => w.week >= todayISO && w.price > 0);
  return weeks.length ? Math.min(...weeks.map(w => w.price)) : null;
}

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

/** the meta description of an apartment page */
export function aptMetaDescription(a: AptLike & Pick<Apartment, "price_per_night">) {
  const who = a.max_guests ? `עד ${a.max_guests} אנשים` : "";
  if (isAgency(a)) {
    const from = minWeekPrice(a);
    const size = a.sqm ? ` של ${a.sqm} מ״ר` : "";
    return `${aptKind(a)}${size} בואל טורנס${who ? `, ${who}` : ""}. שבוע שלם משבת לשבת${from ? `, החל מ-${eur(from)} לדירה` : ""}. אפשר להוסיף סקי פס, הסעה משדה התעופה וציוד באותה הזמנה, וכל אחד משלם את החלק שלו.`;
  }
  // our nightly prices follow the calendar, so no single "from" price here
  return `${a.name}: ${aptKind(a)} שלנו בואל טורנס${who ? `, ${who}` : ""}. בוחרים תאריכים ורואים את המחיר לדירה כולה, כולל ניקיון. אפשר להוסיף סקי פס, הסעה משדה התעופה וציוד באותה הזמנה, וכל אחד משלם את החלק שלו.`;
}
