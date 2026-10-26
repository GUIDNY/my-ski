import type { Apartment } from "@/types";
import { fitDescription } from "./fit-description";

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
  const code = parts.find(p => /^[A-Z0-9][A-Z0-9-]{2,9}$/.test(p) && /\d/.test(p) && /[A-Z]/.test(p)) ?? null;
  const residence = parts.find(p => /[A-Za-zÀ-ÿ]/.test(p) && /\s/.test(p) && !/[א-ת]/.test(p)) ?? null;
  // a Hebrew title written for the listing ("סטודיו עם מרפסת דרומית ליד המסלולים"), between the type and the code
  const title = parts.length >= 3 ? (parts.slice(1).find(p => /[א-ת]/.test(p) && p.split(/\s+/).length >= 3) ?? null) : null;
  return { code, residence, title };
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
  const { residence, title } = aptParts(a);
  if (title) return title;
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
  const { residence, title } = aptParts(a);
  const size = a.sqm ? ` · ${a.sqm} מ״ר` : "";
  if (title) return `${title} בואל טורנס${who ? ` · ${who}` : ""}${size}`;
  return `${aptKind(a)}${who ? ` ${who}` : ""} בואל טורנס${size}${residence ? ` · ${residence}` : ""}`;
}

/**
 * The size in m². Some agency rows carry a default (25 m² for a 4-room flat
 * for 8) while the listing's own text says "כ-80 מ"ר": when the text states a
 * size, that one counts (the largest one it mentions, so a balcony doesn't).
 */
export function aptSqm(a: Pick<Apartment, "sqm"> & { description?: string | null }): number | null {
  const said = [...(a.description || "").matchAll(/(\d{2,3})\s*מ["״]ר/g)].map(m => Number(m[1])).filter(n => n >= 12 && n <= 300);
  if (said.length) return Math.max(...said);
  return a.sqm ? Number(a.sqm) : null;
}

/** the apartment with its listed size (see aptSqm), for everything that shows it */
export function withListedSize<T extends Pick<Apartment, "sqm"> & { description?: string | null }>(a: T): T {
  const sqm = aptSqm(a);
  return sqm && sqm !== a.sqm ? { ...a, sqm } : a;
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
  const extras = "אפשר להוסיף סקי פס, הסעה וציוד, וכל אחד משלם את החלק שלו.";
  if (isAgency(a)) {
    const from = minWeekPrice(a);
    const size = a.sqm ? ` של ${a.sqm} מ״ר` : "";
    return fitDescription([
      `${aptKind(a)}${size} בואל טורנס${who ? `, ${who}` : ""}.`,
      `שבוע שלם משבת לשבת${from ? `, החל מ-${eur(from)} לדירה` : ""}.`,
      extras,
    ]);
  }
  // our nightly prices follow the calendar, so no single "from" price here
  return fitDescription([
    `${a.name}: ${aptKind(a)} שלנו בואל טורנס${who ? `, ${who}` : ""}.`,
    "המחיר לפי התאריכים, לדירה כולה כולל ניקיון.",
    extras,
  ]);
}
