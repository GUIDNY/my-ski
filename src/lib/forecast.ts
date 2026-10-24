/*
 * Val Thorens weather: a 10-day forecast from Open-Meteo (free, no key,
 * CC BY 4.0, so the page credits it), for the village (2,300 m) and the top
 * of the lifts (3,200 m, Cime Caron). Cached for 30 minutes.
 */

export const VT = { lat: 45.2975, lon: 6.58, village: 2300, top: 3200 };

export type Day = {
  date: string; code: number; max: number; min: number; topMax: number; topMin: number;
  snow: number; rainChance: number; wind: number; gusts: number; freezing: number | null;
};
export type Forecast = {
  updated: string;
  now: { temp: number; code: number; wind: number; topTemp: number; feels: number };
  days: Day[];
  snow7: number;
};

type OM = {
  current?: { time: string; temperature_2m: number; apparent_temperature?: number; weather_code: number; wind_speed_10m: number };
  daily?: Record<string, (number | string)[]>;
  hourly?: { time: string[]; freezing_level_height?: number[] };
};

const BASE = "https://api.open-meteo.com/v1/forecast";

async function om(elevation: number, extra: string): Promise<OM | null> {
  const url = `${BASE}?latitude=${VT.lat}&longitude=${VT.lon}&elevation=${elevation}&timezone=Europe%2FParis&forecast_days=10&${extra}`;
  try {
    const r = await fetch(url, { next: { revalidate: 1800 } });
    if (!r.ok) return null;
    return (await r.json()) as OM;
  } catch { return null; }
}

export async function getForecast(): Promise<Forecast | null> {
  const [v, t] = await Promise.all([
    om(VT.village, "current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,snowfall_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&hourly=freezing_level_height"),
    om(VT.top, "current=temperature_2m&daily=temperature_2m_max,temperature_2m_min"),
  ]);
  if (!v?.daily || !v.current) return null;
  const d = v.daily as Record<string, number[]> & { time: string[] };
  const td = (t?.daily ?? {}) as Record<string, number[]>;
  // freezing level at midday, each day
  const fl = new Map<string, number>();
  (v.hourly?.time ?? []).forEach((ts, i) => { if (ts.endsWith("T13:00")) fl.set(ts.slice(0, 10), Number(v.hourly?.freezing_level_height?.[i])); });
  const days: Day[] = d.time.map((date, i) => ({
    date,
    code: Number(d.weather_code?.[i] ?? 0),
    max: Number(d.temperature_2m_max?.[i]), min: Number(d.temperature_2m_min?.[i]),
    topMax: Number(td.temperature_2m_max?.[i] ?? NaN), topMin: Number(td.temperature_2m_min?.[i] ?? NaN),
    snow: Number(d.snowfall_sum?.[i] ?? 0),
    rainChance: Number(d.precipitation_probability_max?.[i] ?? 0),
    wind: Number(d.wind_speed_10m_max?.[i] ?? 0), gusts: Number(d.wind_gusts_10m_max?.[i] ?? 0),
    freezing: fl.has(date) && Number.isFinite(fl.get(date)) ? Math.round(fl.get(date)! / 50) * 50 : null,
  }));
  return {
    updated: v.current.time,
    now: {
      temp: v.current.temperature_2m, code: v.current.weather_code, wind: v.current.wind_speed_10m,
      feels: v.current.apparent_temperature ?? v.current.temperature_2m,
      topTemp: Number((t?.current as { temperature_2m?: number } | undefined)?.temperature_2m ?? NaN),
    },
    days,
    snow7: Math.round(days.slice(0, 7).reduce((s, x) => s + (x.snow || 0), 0)),
  };
}

/** WMO weather code → an emoji and a short word in each language */
export function weatherOf(code: number): { icon: string; he: string; en: string; fr: string } {
  if (code === 0) return { icon: "☀️", he: "שמשי", en: "Sunny", fr: "Ensoleillé" };
  if (code <= 2) return { icon: "🌤️", he: "מעונן חלקית", en: "Partly cloudy", fr: "Éclaircies" };
  if (code === 3) return { icon: "☁️", he: "מעונן", en: "Cloudy", fr: "Couvert" };
  if (code === 45 || code === 48) return { icon: "🌫️", he: "ערפל", en: "Fog", fr: "Brouillard" };
  if (code >= 51 && code <= 57) return { icon: "🌦️", he: "טפטוף", en: "Drizzle", fr: "Bruine" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: "🌧️", he: "גשם", en: "Rain", fr: "Pluie" };
  if (code >= 71 && code <= 77) return { icon: "❄️", he: "שלג", en: "Snow", fr: "Neige" };
  if (code === 85 || code === 86) return { icon: "🌨️", he: "ממטרי שלג", en: "Snow showers", fr: "Averses de neige" };
  if (code >= 95) return { icon: "⛈️", he: "סופת רעמים", en: "Thunderstorm", fr: "Orage" };
  return { icon: "🌥️", he: "מעונן", en: "Cloudy", fr: "Nuageux" };
}
