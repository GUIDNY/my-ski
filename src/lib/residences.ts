import type { Apartment } from "@/types";
import { aptParts } from "./apartment-display";

/*
 * The building (residence) and the neighbourhood of every apartment, for the
 * filters and the cards. Weekly apartments are known by the agency's code,
 * whose letters name the building ("ESK201" = L'Eskival); the map below was
 * built from the agencies' own pages (26.10.2026). Our own apartments by their
 * name ("נבס 154" = Les Névés).
 */

type Q = "Caron" | "Péclet" | "Arolles" | "Slalom" | "Balcons" | "Soleil";

export const QUARTER_HE: Record<Q, string> = {
  Caron: "קרון (מרכז הכפר)",
  Péclet: "פקלה (החלק העליון)",
  Arolles: "ארול (כניסה לכפר)",
  Slalom: "סלאלום (שקט, ליד המסלולים)",
  Balcons: "הבלקונים (שקט, צ'אלטים)",
  Soleil: "סולייל (החלק התחתון)",
};

const BY_PREFIX: Record<string, [string | null, Q]> = {
  ALA: ["Alaska", "Balcons"], ALT: ["Altineige", "Arolles"], ARC: ["Arcelle", "Caron"],
  BAL: ["Chalet Les Balcons", "Balcons"], BOUQ: ["Chalet Bouquetin", "Balcons"], BS: ["Beausoleil", "Arolles"],
  CC: ["Les Cimes de Caron", "Arolles"], CHAM: ["Chalet Chamois", "Balcons"], CRI: ["Cristallo", "Slalom"],
  CUZ: ["Les Temples du Soleil", "Soleil"], MA: ["Les Temples du Soleil", "Soleil"], MAC: ["Les Temples du Soleil", "Soleil"],
  NAZ: ["Les Temples du Soleil", "Soleil"], PI: ["Les Temples du Soleil", "Soleil"], TIK: ["Les Temples du Soleil", "Soleil"],
  DAPH: ["Les Daphnés", "Péclet"], DIA: ["Le Diamant", "Caron"], DOM: ["Dôme de Polset", "Slalom"], DP: ["Dôme de Polset", "Slalom"],
  ESK: ["L'Eskival", "Caron"], ET: ["Les Eterlous", "Caron"], ETE: ["Les Eterlous", "Caron"],
  GDP: ["Galerie de Péclet", "Péclet"], PEC: ["Galerie de Péclet", "Péclet"], GLA: ["Les Glaciers", "Péclet"], GLAC: ["Les Glaciers", "Péclet"],
  HCA: ["Les Hauts de Chavière", "Slalom"], HCB: ["Les Hauts de Chavière", "Slalom"], HCHA: ["Les Hauts de Chavière", "Slalom"], HCHB: ["Les Hauts de Chavière", "Slalom"],
  HV: ["Les Hauts de la Vanoise", "Péclet"], JOK: ["Le Joker", "Arolles"], JOKB: ["Le Joker", "Arolles"], JOKC: ["Le Joker", "Arolles"],
  LB: ["Le Lac Blanc", "Péclet"], LBL: ["Le Lac Blanc", "Péclet"], LAU: [null, "Soleil"], LIZ: [null, "Slalom"],
  LL: ["Le Lac du Lou", "Caron"], LOU: ["Le Lac du Lou", "Caron"], MOUFL: ["Chalet Mouflon", "Balcons"],
  NEV: ["Les Névés", "Péclet"], NV: ["Les Névés", "Péclet"], OL: ["Olympic", "Slalom"], OLY: ["Olympic", "Slalom"],
  ORC: ["L'Orsière", "Caron"], ORS: ["L'Orsière", "Caron"], RB: ["La Roche Blanche", "Caron"], ROB: ["La Roche Blanche", "Caron"],
  REB: ["La Reine Blanche", "Arolles"], REI: ["La Reine Blanche", "Arolles"],
  ROC: ["Le Roc de Péclet", "Slalom"], ROCB: ["Le Roc de Péclet", "Slalom"], RPB: ["Le Roc de Péclet", "Slalom"], RPC: ["Le Roc de Péclet", "Slalom"],
  ROS: ["Rosael", "Balcons"], SC: ["Le Schuss", "Slalom"], SCH: ["Le Schuss", "Slalom"], SEQ: ["Chalet Séquoia", "Péclet"],
  SERAI: ["Le Sérac", "Slalom"], SERAM: ["Le Sérac", "Slalom"], SERAU: ["Le Sérac", "Slalom"], SERAV: ["Le Sérac", "Slalom"], SERAW: ["Le Sérac", "Slalom"],
  SRH: ["Le Sérac", "Slalom"], SRL: ["Le Sérac", "Slalom"], SRM: ["Le Sérac", "Slalom"], SRP: ["Le Sérac", "Slalom"],
  SIL: ["Silveralp", "Soleil"], TV: ["Trois Vallées", "Péclet"], VA: ["Trois Vallées", "Péclet"],
  VAN: ["La Vanoise", "Caron"], ZE: ["Le Zénith", "Caron"],
};

/** our own apartments, by the first word of their name */
const OWN: [RegExp, string, Q | null][] = [
  [/^נבס/, "Les Névés", "Péclet"], [/^(דומה|דום|ddp)/i, "Dôme de Polset", "Slalom"], [/^סרק/, "Le Sérac", "Slalom"],
  [/^גלסי/, "Les Glaciers", "Péclet"], [/^(אלימפי|אולימפי)/, "Les Olympiades", null],
];

export type Place = { residence: string | null; quarter: Q | null };

export function placeOf(a: Pick<Apartment, "name" | "source">): Place {
  if (a.source !== "la_cime") {
    const hit = OWN.find(([re]) => re.test(a.name.trim()));
    return hit ? { residence: hit[1], quarter: hit[2] } : { residence: null, quarter: null };
  }
  const parts = aptParts(a);
  const code = parts.code || "";
  const letters = (code.match(/^\d*([A-Z]+)/) || [])[1] || "";
  // the longest known prefix: "SERAW4" → SERAW, "CC2100" → CC, "3VA713" → VA
  for (let n = letters.length; n > 0; n--) {
    const hit = BY_PREFIX[letters.slice(0, n)];
    if (hit) return { residence: hit[0], quarter: hit[1] };
  }
  // a few listings carry the building in their name instead ("Résidence Sérac")
  const named = parts.residence?.replace(/^R[ée]sidence\s+/i, "") || null;
  const known = named ? Object.values(BY_PREFIX).find(([r]) => r && r.toLowerCase().includes(named.toLowerCase())) : null;
  return known ? { residence: known[0], quarter: known[1] } : { residence: named, quarter: null };
}

/** "סטודיו" for studios, otherwise the number of bedrooms (0 when unknown) */
export function bedroomsOf(a: Pick<Apartment, "type" | "beds">): "studio" | number {
  if ((a.type || "").trim() === "סטודיו") return "studio";
  return Number(a.beds) || 0;
}
