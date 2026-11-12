/*
 * Which language a customer's emails go out in. The n8n email workflow writes
 * the English version when it gets lang "en" (French customers get English too).
 * 1) the order says so: ops.lang, saved when it was made on the English/French site;
 * 2) otherwise a foreign customer is guessed: no Hebrew in the name and a phone
 *    that isn't Israeli (orders from a quote paid with a foreign card, the bot…).
 */
type OrderLike = { ops?: unknown; customer_name?: string | null; customer_phone?: string | null };

const HEBREW = /[֐-׿]/;

function israeliPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, "");
  if (!d) return true; // no phone: nothing says foreign
  return d.startsWith("972") || /^0[5-9]/.test(d) || (d.length === 9 && d.startsWith("5"));
}

export function orderLang(o: OrderLike | null | undefined): "en" | "he" {
  if (!o) return "he";
  const saved = (o.ops as { lang?: string } | null)?.lang;
  if (saved === "en" || saved === "fr") return "en";
  if (saved === "he") return "he";
  const name = String(o.customer_name || "");
  const phone = String(o.customer_phone || "");
  if (name && !HEBREW.test(name) && phone && !israeliPhone(phone)) return "en";
  return "he";
}
