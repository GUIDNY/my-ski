// EUR → ILS rate (Bank of Israel representative, cached 12h) + a "cash/sell"
// markup so the shekel price reflects the slightly-higher sell rate.
export async function getEurToIls(): Promise<number> {
  try {
    const r = await fetch("https://boi.org.il/PublicApi/GetExchangeRate?key=EUR", { next: { revalidate: 43200 } });
    const j = await r.json();
    const rate = Number(j?.currentExchangeRate);
    if (rate > 0) return rate;
  } catch {}
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/EUR", { next: { revalidate: 43200 } });
    const j = await r.json();
    const rate = Number(j?.rates?.ILS);
    if (rate > 0) return rate;
  } catch {}
  return 3.9; // safe fallback
}

// sell/cash rate markup over the representative rate (e.g. 1.02 = +2%)
export const SELL_MARKUP = Number(process.env.EUR_ILS_MARKUP || "1.02");

// the shekel rate a customer actually pays
export async function getSellRate(): Promise<number> {
  return (await getEurToIls()) * SELL_MARKUP;
}
