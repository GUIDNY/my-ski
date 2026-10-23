import translations from "./apartments.json";
import type { Lang } from "./config";
import { DICT } from "./dict";
import type { Apartment } from "@/types";

/*
 * Apartment names, types and descriptions are Hebrew in the database.
 * apartments.json holds human-checked English and French translations by
 * apartment id. An apartment missing from it (a new one) gets an honest
 * fallback built only from its structured fields, never a guessed text.
 * Server only: the JSON stays out of the browser bundles.
 */

type Text = { name: string; type: string; description: string };
const T = translations as unknown as Record<string, Partial<Record<Lang, Partial<Text>>>>;

export type AptFields = Pick<Apartment, "id" | "name" | "type" | "beds" | "baths" | "sqm" | "max_guests" | "source" | "amenities">;

export const isAgency = (a: { source?: string | null }) => a.source === "la_cime";

const HEBREW = /[֐-׿]/;
const nb = " ";

/** The Hebrew types the admin uses ("סטודיו", "3 חדרים", "דירה"), in English or French. */
export function typeFromData(type: string | null | undefined, lang: Lang): string | null {
  const s = (type || "").trim();
  if (s === "סטודיו") return "Studio";
  const rooms = s.match(/^(\d+)\s*חדרים$/);
  if (rooms) return lang === "fr" ? `Appartement ${rooms[1]}${nb}pièces` : `${rooms[1]}-room apartment`;
  if (s === "דירה") return lang === "fr" ? "Appartement" : "Apartment";
  return null; // free text such as "cozy" is not a type
}

export const isStudio = (a: Pick<Apartment, "type">) => (a.type || "").trim() === "סטודיו";

/**
 * The name when there is no translation: the Hebrew type words translated,
 * other Hebrew words (building names) left out rather than transliterated.
 * "2 חדרים — HCHA27" → "2-room apartment — HCHA27", "דומה 302" → "Apartment 302".
 */
export function fallbackName(a: Pick<Apartment, "name" | "type">, lang: Lang): string {
  const generic = typeFromData(a.type, lang) ?? (lang === "fr" ? "Appartement" : "Apartment");
  let s = (a.name || "")
    .replace(/(\d+)\s*חדרים/g, (_, n: string) => (lang === "fr" ? `Appartement ${n}${nb}pièces` : `${n}-room apartment`))
    .replace(/סטודיו/g, "Studio")
    .replace(/דירה/g, lang === "fr" ? "Appartement" : "Apartment");
  if (HEBREW.test(s)) {
    s = s.split(/\s+/).filter(w => !HEBREW.test(w)).join(" ").replace(/^[\s\-–—·,]+|[\s\-–—·,]+$/g, "").trim();
    s = s ? `${generic} ${s}` : generic;
  }
  return s.trim() || generic;
}

/** Bedrooms are only stated where the data says so reliably: agency apartments that aren't studios. */
export function bedroomsOf(a: AptFields): number | null {
  if (!isAgency(a) || isStudio(a)) return null;
  const n = Number(a.beds) || 0;
  return n > 0 ? n : null;
}

/** "Studio in Val Thorens for up to 4 guests: 1 bathroom, 28 m²." built from the fields only. */
function fallbackDescription(a: AptFields, lang: Lang): string {
  const t = DICT[lang].common;
  const type = typeFromData(a.type, lang) ?? (lang === "fr" ? "Appartement" : "Apartment");
  const beds = bedroomsOf(a);
  const parts = [
    beds ? t.bedrooms(beds) : "",
    a.baths ? t.bathrooms(Number(a.baths)) : "",
    a.sqm ? t.sqm(Number(a.sqm)) : "",
  ].filter(Boolean);
  const guests = a.max_guests ? Number(a.max_guests) : 0;
  if (lang === "fr") {
    const who = guests ? `, jusqu'à ${guests}${nb}voyageurs` : "";
    return `${type} à Val Thorens${who}${parts.length ? `${nb}: ${parts.join(", ")}` : ""}.`
      + (isAgency(a) ? " Location à la semaine complète, du samedi au samedi." : "");
  }
  const who = guests ? ` for up to ${guests} guest${guests === 1 ? "" : "s"}` : "";
  return `${type} in Val Thorens${who}${parts.length ? `: ${parts.join(", ")}` : ""}.`
    + (isAgency(a) ? " Rented by the full week, Saturday to Saturday." : "");
}

export type AptText = { name: string; type: string | null; description: string; translated: boolean };

export function aptText(a: AptFields, lang: Lang): AptText {
  const tr = T[a.id]?.[lang];
  const name = tr?.name?.trim() || fallbackName(a, lang);
  const type = tr?.type?.trim() || typeFromData(a.type, lang);
  const desc = tr?.description?.trim();
  return { name, type, description: desc || fallbackDescription(a, lang), translated: !!desc };
}

/** The type, unless it's the generic word or the name already says it ("Studio — SCH002"). */
export function typeWorthShowing(text: AptText): string | null {
  const t = text.type?.trim();
  if (!t || /^(apartment|appartement)$/i.test(t)) return null;
  const name = text.name.toLowerCase();
  const n = t.match(/^(\d+)/)?.[1];
  if (n && (name.includes(`${n}-room`) || name.includes(`${n} room`) || name.includes(`${n} pièces`) || name.includes(`${n}${nb}pièces`))) return null;
  return name.includes(t.toLowerCase()) ? null : t;
}

/* Amenities are free Hebrew text in the database: only the ones with a known
   translation are shown (an unknown Hebrew item is left out, never guessed). */
const AMENITIES: Record<string, { en: string; fr: string }> = {
  "WiFi": { en: "Wi-Fi", fr: "Wi-Fi" },
  "אח": { en: "Fireplace", fr: "Cheminée" },
  "חניה": { en: "Parking", fr: "Parking" },
  "ג'קוזי": { en: "Jacuzzi", fr: "Jacuzzi" },
  "מדיח כלים": { en: "Dishwasher", fr: "Lave-vaisselle" },
  "בעלי חיים מותרים": { en: "Pets allowed", fr: "Animaux acceptés" },
  "מעלית": { en: "Lift", fr: "Ascenseur" },
  "וורנדה מוארת": { en: "Bright veranda", fr: "Véranda lumineuse" },
  "מכונת נספרסו": { en: "Nespresso machine", fr: "Machine Nespresso" },
  "כניסה קרובה לפיסטות": { en: "Entrance close to the pistes", fr: "Entrée proche des pistes" },
  "מטבחון מאובזר": { en: "Equipped kitchenette", fr: "Kitchenette équipée" },
  "מרפסת": { en: "Balcony", fr: "Balcon" },
};

export function amenitiesOf(a: Pick<Apartment, "amenities">, lang: Lang): string[] {
  const out: string[] = [];
  for (const raw of a.amenities ?? []) {
    const s = String(raw).trim();
    const known = AMENITIES[s];
    if (known) out.push(known[lang]);
    else if (s && !HEBREW.test(s)) out.push(s);
  }
  return Array.from(new Set(out));
}
