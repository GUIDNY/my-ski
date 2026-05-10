"use client";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import DateRangePicker from "./DateRangePicker";

const AIRPORTS = [
  { code: "TLV", label: "תל אביב (TLV)" },
  { code: "HFA", label: "חיפה (HFA)" },
  { code: "ETH", label: "אילת (ETH)" },
];

const DEST_AIRPORTS: Record<string, string> = {
  "Val Thorens": "GVA", // Geneva — closest major airport (2.5h drive)
};

type Props = {
  destination?: string;
  defaultRange?: DateRange;
  guests?: number;
};

export default function FlightSearch({ destination = "Val Thorens", defaultRange, guests = 2 }: Props) {
  const [origin, setOrigin] = useState("TLV");
  const [range, setRange] = useState<DateRange | undefined>(defaultRange);
  const [pax, setPax] = useState(guests);
  const [searching, setSearching] = useState(false);

  const destCode = DEST_AIRPORTS[destination] ?? "CDG";

  const buildGoogleFlightsUrl = () => {
    const from = range?.from;
    const to = range?.to;
    const fmtDate = (d: Date) => d.toISOString().split("T")[0];

    // Google Flights URL format
    let url = `https://www.google.com/travel/flights/search?`;
    const params = new URLSearchParams({
      hl: "iw",
      curr: "ILS",
    });

    // Construct the route
    if (from) {
      url = `https://www.google.com/travel/flights?hl=iw#flt=${origin}.${destCode}.${fmtDate(from)}`;
      if (to) {
        url += `*${destCode}.${origin}.${fmtDate(to)}`;
      }
      url += `;c:ILS;e:1;sd:1;t:f;a:*${pax};`;
    } else {
      url = `https://www.google.com/travel/flights/search?${params.toString()}&q=flights+from+${origin}+to+${destCode}`;
    }

    return url;
  };

  const buildSkyscannerUrl = () => {
    const from = range?.from;
    const to = range?.to;
    // Skyscanner uses 6-digit YYMMDD format
    const fmtSky = (d: Date) =>
      `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

    const base = `https://www.skyscanner.co.il/transport/flights/${origin.toLowerCase()}/${destCode.toLowerCase()}/`;
    if (!from) return base;
    const outbound = fmtSky(from);
    const inbound  = to ? fmtSky(to) : outbound;
    const qs = `?adultsv2=${pax}&cabinclass=economy&childrenv2=&rtn=1`;
    return `${base}${outbound}/${inbound}/${qs}`;
  };

  const handleSearch = (provider: "google" | "skyscanner") => {
    setSearching(true);
    const url = provider === "google" ? buildGoogleFlightsUrl() : buildSkyscannerUrl();
    window.open(url, "_blank");
    setTimeout(() => setSearching(false), 1000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">✈️</div>
        <div>
          <h3 className="font-black text-gray-900">חיפוש טיסות</h3>
          <p className="text-sm text-gray-500">לעבר {destination} — Geneva (GVA) · 2.5 שעות נסיעה</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Origin */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">מוצא</label>
          <select
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            {AIRPORTS.map(a => (
              <option key={a.code} value={a.code}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">יעד</label>
          <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">Geneva (GVA)</span>
            <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">קרוב לVT</span>
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">נוסעים</label>
          <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
            <button onClick={() => setPax(Math.max(1, pax - 1))} className="px-4 py-3 text-gray-500 hover:text-gray-900 font-bold text-lg">−</button>
            <span className="flex-1 text-center font-bold text-gray-800 text-sm">{pax} נוסעים</span>
            <button onClick={() => setPax(Math.min(9, pax + 1))} className="px-4 py-3 text-gray-500 hover:text-gray-900 font-bold text-lg">+</button>
          </div>
        </div>
      </div>

      {/* Date picker */}
      <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 mb-5">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {/* Search buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={() => handleSearch("google")}
          disabled={searching}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
          </svg>
          Google
        </button>
        <button
          onClick={() => handleSearch("skyscanner")}
          disabled={searching}
          className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2l-2 2 7.5 3.5L7.8 14l-1.4 1.4-.7 2.1 2.1-.7 1.4-1.4 3.5 7.5z"/>
          </svg>
          Skyscanner
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        פותח חיפוש טיסות TLV → Geneva (GVA) בחלון חדש
      </p>
    </div>
  );
}
