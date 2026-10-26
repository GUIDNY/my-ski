/*
 * Val Thorens Immobilier (Arkiane) pages → data. Pure functions, tested on saved pages.
 *  - parseResults: the search results of one week (RefreshAvailabilities): every free
 *    lot with its reference, lot number, price for that week, size line and photos.
 *  - parseDetail: a lot page (Lot/Detail): rooms, m², bedrooms, bathrooms, guests,
 *    the French description, and all its photos.
 */

const decode = (s: string) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const text = (h: string) => decode(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const euros = (s: string) => { const d = decode(s).replace(/[^\d,]/g, "").replace(/,\d+$/, ""); return d ? parseInt(d, 10) : 0; };

export type VtiOffer = {
  lotNo: string; ref: string; price: number;
  catcher: string; kind: string; pax: number; comfort: string; pictos: string[]; images: string[];
};

export function parseResults(html: string): VtiOffer[] {
  const out: VtiOffer[] = [];
  const seen = new Set<string>();
  const parts = html.split(/<div id="availability-(\d+)" class="card availability">/);
  for (let i = 1; i < parts.length; i += 2) {
    const lotNo = parts[i], card = parts[i + 1] || "";
    const ref = card.match(/class="ml-1 item-reference">\s*<label[^>]*>\s*([A-Z0-9-]+)\s*</)?.[1]
      || card.match(/name="compare" id="compare-\d+" value="([^"]+)"/)?.[1];
    const rate = card.match(/<div class="rate">([^<]+)<\/div>/)?.[1];
    if (!ref || !rate || seen.has(ref)) continue;
    const price = euros(rate);
    if (!price) continue;
    seen.add(ref);
    const li = (name: string) => text(card.match(new RegExp(`<li data-name="${name}"[^>]*>([\\s\\S]*?)</li>`))?.[1] || "");
    out.push({
      lotNo, ref, price,
      catcher: text(card.match(/class="availability-catcher[^"]*">([\s\S]*?)<\/div>/)?.[1] || "").replace(/…$/, "").trim(),
      kind: li("lib_lot_type_cial"),
      pax: parseInt(li("lot_pax"), 10) || 0,
      comfort: li("lib_lot_confort"),
      pictos: [...card.matchAll(/class="picto is-criteria ([a-z_]+)"/g)].map(m => m[1]),
      images: [...new Set([...card.matchAll(/href="(https?:\/\/[^"]+\/lv\/images\/lot\/\d+_\d+\.jpg)/g)].map(m => m[1]))],
    });
  }
  return out;
}

export type VtiDetail = {
  rooms: number; sqm: number; bedrooms: number; baths: number; pax: number;
  title: string; description: string; images: string[];
};

export function parseDetail(html: string): VtiDetail {
  const t = text(html);
  const m = t.match(/(\d+) pièces? (\d+) personnes (\d+) m² (\d+) chambres? (\d+) salles? de bain/)
    || t.match(/(Studio)\s+(\d+) personnes (\d+) m² (\d+) chambres? (\d+) salles? de bain/i);
  const desc = t.match(/ Description (.+?) Localisation /)?.[1] || "";
  const title = t.match(/Votre recherche › \S+ .+? - Val Thorens (.+?) (?:\d+ pièces?|Studio) \d+ personnes/)?.[1] || "";
  return {
    rooms: m ? (/studio/i.test(m[1]) ? 1 : parseInt(m[1], 10)) : 0,
    pax: m ? parseInt(m[2], 10) : 0,
    sqm: m ? parseInt(m[3], 10) : 0,
    bedrooms: m ? parseInt(m[4], 10) : 0,
    baths: m ? parseInt(m[5], 10) : 0,
    title: title.trim(),
    description: desc.replace(/\s*Voir plus :.*$/, "").trim(),
    images: [...new Set([...html.matchAll(/(https?:\/\/[^"' ]+\/lv\/images\/lot\/\d+_\d+\.jpg)/g)].map(x => x[1]))].sort(),
  };
}

/** "3 pièces / 3 pièces cabine" → "3 חדרים", "Studio …" → "סטודיו" (the words the site already translates) */
export function kindHe(kind: string, rooms = 0): string {
  if (/studio/i.test(kind) || rooms === 1) return "סטודיו";
  const n = parseInt(kind, 10) || rooms;
  return n > 1 ? `${n} חדרים` : "דירה";
}

/** the equipment icons we can say in Hebrew; anything else is left out */
export const PICTO_HE: Record<string, string> = {
  lot_lave_vaisselle: "מדיח כלים", lot_tv: "טלוויזיה", lot_lave_linge: "מכונת כביסה", lot_seche_linge: "מייבש כביסה",
  lot_cheminee: "אח", lot_animaux: "בעלי חיים מותרים", lot_balcon: "מרפסת", lot_terrasse: "מרפסת",
  lot_wifi: "Wi-Fi", lot_ascenseur: "מעלית", lot_sauna: "סאונה", lot_casier_ski: "לוקר סקי",
};
