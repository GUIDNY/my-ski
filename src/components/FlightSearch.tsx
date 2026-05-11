"use client";
import { useState } from "react";
import SkiCalendar from "./SkiCalendar";

const AIRPORTS = [
  { code: "TLV", label: "תל אביב (TLV)" },
  { code: "HFA", label: "חיפה (HFA)" },
  { code: "ETH", label: "אילת (ETH)" },
];

const DEST_OPTIONS = [
  { code: "GVA", label: "Geneva (GVA)", note: "2.5 שעות נסיעה" },
  { code: "LYS", label: "Lyon (LYS)",   note: "3 שעות נסיעה" },
];

type Props = {
  destination?: string;
  defaultCheckin?: string;
  defaultCheckout?: string;
  guests?: number;
};

/*
 * Build Google Flights `tfs` query parameter (protobuf-encoded round trip).
 * Structure reverse-engineered from real Google Flights URLs.
 */
function buildTfs(outDate: string, retDate: string, origin: string, dest: string): string {
  const enc = (s: string) => s.split("").map(c => c.charCodeAt(0));
  const makeLeg = (date: string, from: string, to: string) => {
    const leg = [
      0x12, 0x0a, ...enc(date),
      0x6a, 0x07, 0x08, 0x01, 0x12, 0x03, ...enc(from),
      0x72, 0x07, 0x08, 0x01, 0x12, 0x03, ...enc(to),
    ];
    return [0x1a, leg.length, ...leg];
  };
  const bytes = [0x08, 0x01, 0x10, 0x02, ...makeLeg(outDate, origin, dest), ...makeLeg(retDate, dest, origin)];
  return btoa(String.fromCharCode(...bytes));
}

export default function FlightSearch({ destination = "Val Thorens", defaultCheckin, defaultCheckout, guests = 2 }: Props) {
  const [origin,    setOrigin]    = useState("TLV");
  const [dest,      setDest]      = useState("GVA");
  const [checkin,   setCheckin]   = useState(defaultCheckin  ?? "");
  const [checkout,  setCheckout]  = useState(defaultCheckout ?? "");
  const [pax,       setPax]       = useState(guests);
  const [searching,  setSearching]  = useState(false);
  const [calOpen,    setCalOpen]    = useState(false);

  const destInfo = DEST_OPTIONS.find(d => d.code === dest) ?? DEST_OPTIONS[0];

  const buildGoogleFlightsUrl = () => {
    if (checkin && checkout) {
      const tfs = buildTfs(checkin, checkout, origin, dest);
      return `https://www.google.com/travel/flights?hl=iw&gl=il&curr=EUR&tfs=${tfs}`;
    }
    return `https://www.google.com/travel/flights?hl=iw&gl=il&curr=EUR&q=flights+from+${origin}+to+${dest}`;
  };

  const buildSkyscannerUrl = () => {
    const fmtSky = (iso: string) => {
      const d = new Date(iso + "T12:00:00");
      return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    };
    const base = `https://www.skyscanner.co.il/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/`;
    if (!checkin) return base;
    const qs = `?adultsv2=${pax}&cabinclass=economy&childrenv2=&rtn=1`;
    return `${base}${fmtSky(checkin)}/${checkout ? fmtSky(checkout) : fmtSky(checkin)}/${qs}`;
  };

  const handleSearch = (provider: "google" | "skyscanner") => {
    setSearching(true);
    window.open(provider === "google" ? buildGoogleFlightsUrl() : buildSkyscannerUrl(), "_blank");
    setTimeout(() => setSearching(false), 1000);
  };

  const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
  const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`; };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">✈️</div>
        <div>
          <h3 className="font-black text-gray-900">חיפוש טיסות</h3>
          <p className="text-sm text-gray-500">
            לעבר {destination} — {destInfo.label} · {destInfo.note}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Origin */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">מוצא</label>
          <select value={origin} onChange={e => setOrigin(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
            {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">יעד</label>
          <select value={dest} onChange={e => setDest(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
            {DEST_OPTIONS.map(d => (
              <option key={d.code} value={d.code}>{d.label} — {d.note}</option>
            ))}
          </select>
        </div>

        {/* Passengers */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">נוסעים</label>
          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
            <button onClick={() => setPax(Math.max(1, pax - 1))} className="px-4 py-3 text-gray-500 hover:text-gray-900 font-bold text-lg">−</button>
            <span className="flex-1 text-center font-bold text-gray-800 text-sm">{pax} נוסעים</span>
            <button onClick={() => setPax(Math.min(9, pax + 1))} className="px-4 py-3 text-gray-500 hover:text-gray-900 font-bold text-lg">+</button>
          </div>
        </div>
      </div>

      {/* Date pill — click to open calendar */}
      <button
        onClick={() => setCalOpen(o => !o)}
        className={`w-full flex items-center justify-between rounded-xl px-4 py-3 mb-3 border text-sm transition-colors
          ${calOpen ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200 hover:border-blue-300"}`}
      >
        <span className={checkin && checkout ? "font-bold text-gray-800" : "text-gray-400"}>
          {checkin && checkout ? `${fmtDate(checkin)} — ${fmtDate(checkout)}` : "בחר תאריכים"}
        </span>
        <div className="flex items-center gap-2">
          {checkin && checkout && (
            <span
              onClick={e => { e.stopPropagation(); setCheckin(""); setCheckout(""); setCalOpen(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-1"
            >נקה ×</span>
          )}
          <span className="text-gray-400 text-xs">{calOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* SkiCalendar — only when open */}
      {calOpen && (
        <div className="mb-5">
          <SkiCalendar
            initialFrom={checkin || undefined}
            initialTo={checkout || undefined}
            onSelect={(from, to) => { setCheckin(from); setCheckout(to); setCalOpen(false); }}
            onCancel={() => setCalOpen(false)}
          />
        </div>
      )}

      {/* Search buttons */}
      <div className="flex gap-2.5">
        <button onClick={() => handleSearch("skyscanner")} disabled={searching}
          className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2l-2 2 7.5 3.5L7.8 14l-1.4 1.4-.7 2.1 2.1-.7 1.4-1.4 3.5 7.5z"/>
          </svg>
          Skyscanner
        </button>
        <button onClick={() => handleSearch("google")} disabled={searching}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
          </svg>
          Google Flights
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        פותח חיפוש טיסות {origin} → {dest} בחלון חדש
      </p>
    </div>
  );
}
