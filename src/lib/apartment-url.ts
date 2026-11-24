import type { Apartment } from "@/types";
import { aptParts } from "./apartment-display";

/*
 * Apartment page addresses: a readable part, then the apartment's id —
 * /apartments/studio-3-guests-val-thorens-hca3-ee3318b8-…. Only the id at the
 * end finds the apartment; the readable part is for people and search
 * engines. An address with the bare id (old links, emails, proposals) or an
 * outdated readable part moves for good to the current one.
 */

type SlugLike = Pick<Apartment, "id" | "name" | "type" | "max_guests">;

const UUID_TAIL = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** the apartment id at the end of an address segment, or null */
export function aptIdOf(segment: string): string | null {
  const m = String(segment || "").match(UUID_TAIL);
  return m ? m[1].toLowerCase() : null;
}

const latin = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** "studio-3-guests-val-thorens-hca3" */
export function aptSlug(a: Omit<SlugLike, "id">): string {
  const t = (a.type || "").trim();
  const rooms = t.match(/^(\d+)\s*חדרים$/);
  const kind = t === "סטודיו" ? "studio" : rooms ? `${rooms[1]}-room-apartment` : "apartment";
  const { code, residence } = aptParts(a);
  return [kind, a.max_guests ? `${a.max_guests}-guests` : "", "val-thorens", residence ? latin(residence) : "", code ? latin(code) : ""]
    .filter(Boolean).join("-");
}

/** the address segment of an apartment: "studio-3-guests-val-thorens-hca3-<id>" */
export const aptSegment = (a: SlugLike) => `${aptSlug(a)}-${a.id}`;

/** "/apartments/<segment>", or "/en/apartments/<segment>" */
export const aptPath = (a: SlugLike, lang?: "en" | "fr") => `${lang ? `/${lang}` : ""}/apartments/${aptSegment(a)}`;

/** the query string of a page's search params ("?checkin=…" or "") */
export function queryOf(sp: Record<string, string | string[] | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v == null ? [] : [v]) p.append(k, x);
  const s = p.toString();
  return s ? `?${s}` : "";
}
