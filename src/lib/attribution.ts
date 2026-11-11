/*
 * Where a visitor came from (first visit), so every lead shows its source:
 * Google Ads, Google search, ChatGPT, Facebook, Instagram, a link, or direct.
 * Kept in the visitor's browser only (localStorage "ss_src"); it travels with the
 * lead in the WhatsApp message ("מקור: …") and in the site chat request.
 */
export type Source = { src: string; landing: string; at: string };
const KEY = "ss_src";

function detect(): Source {
  const u = new URL(window.location.href);
  const p = u.searchParams;
  const ref = (() => { try { return document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch { return ""; } })();
  const utm = (p.get("utm_source") || "").toLowerCase();
  const camp = p.get("utm_campaign") || "";
  let src = "ישיר";
  if (p.get("gclid") || p.get("gbraid") || p.get("wbraid") || (/google/.test(utm) && /cpc|ads|paid/.test((p.get("utm_medium") || "").toLowerCase()))) src = "Google Ads";
  else if (p.get("fbclid") || /facebook|fb|meta/.test(utm)) src = "Facebook";
  else if (/instagram|ig/.test(utm)) src = "Instagram";
  else if (/chatgpt|openai/.test(utm)) src = "ChatGPT";
  else if (utm) src = utm;
  else if (/chatgpt\.com|openai\.com/.test(ref)) src = "ChatGPT";
  else if (/perplexity/.test(ref)) src = "Perplexity";
  else if (/gemini\.google/.test(ref)) src = "Gemini";
  else if (/(^|\.)google\./.test(ref)) src = "Google (חיפוש)";
  else if (/bing\./.test(ref)) src = "Bing";
  else if (/facebook\.com|fb\.com/.test(ref)) src = "Facebook";
  else if (/instagram\.com/.test(ref)) src = "Instagram";
  else if (/tiktok/.test(ref)) src = "TikTok";
  else if (ref && !/skisharebook\.com$/.test(ref)) src = ref;
  if (camp && !src.includes(camp)) src += ` (${camp.slice(0, 40)})`;
  return { src, landing: u.pathname.slice(0, 120), at: new Date().toISOString() };
}

/** the first-visit source (saved on the first page view; a paid click later wins over "direct") */
export function rememberSource(): Source | null {
  if (typeof window === "undefined") return null;
  try {
    const now = detect();
    const old = JSON.parse(localStorage.getItem(KEY) || "null") as Source | null;
    const keep = old && !(old.src === "ישיר" && now.src !== "ישיר") ? old : now;
    localStorage.setItem(KEY, JSON.stringify(keep));
    return keep;
  } catch { return null; }
}

export function currentSource(): Source | null {
  if (typeof window === "undefined") return null;
  try { return (JSON.parse(localStorage.getItem(KEY) || "null") as Source | null) ?? rememberSource(); } catch { return null; }
}

/** "מקור: …" as it is added to a WhatsApp message, and read back from it */
export const SOURCE_TAG = "מקור:";
export const sourceLine = (s: Source) => `${SOURCE_TAG} ${s.src}`;
export const sourceInText = (t: string): string | null => {
  const m = String(t || "").match(/מקור:\s*([^\n]+)/);
  return m ? m[1].trim().slice(0, 80) : null;
};
