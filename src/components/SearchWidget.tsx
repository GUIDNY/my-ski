"use client";
import { useState } from "react";

const ADDONS = [
  { id: "skipass", icon: "🎿", label: "סקי פס" },
  { id: "transfer", icon: "🚌", label: "הסעה" },
  { id: "flight", icon: "✈️", label: "טיסה" },
  { id: "insurance", icon: "🛡️", label: "ביטוח" },
];

export default function SearchWidget() {
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(2);
  const [addons, setAddons] = useState<string[]>(["skipass"]);

  const toggleAddon = (id: string) => {
    setAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <div id="search" className="glass-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-4xl" dir="rtl">
      {/* Destination badge */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2">
          <span className="text-lg">📍</span>
          <span className="font-bold text-blue-700 text-sm">Val Thorens, צרפת</span>
          <span className="text-xs text-blue-400 mr-1">2,300 מ׳ גובה</span>
        </div>
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          <span className="text-xs font-semibold text-green-700">שלג טרי</span>
        </div>
      </div>

      {/* Date + guests row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 tracking-wider uppercase">הגעה</label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📅</span>
            <input
              type="date"
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pr-9 pl-4 py-3.5 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 tracking-wider uppercase">יציאה</label>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📅</span>
            <input
              type="date"
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl pr-9 pl-4 py-3.5 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-400 tracking-wider uppercase">אנשים</label>
          <div className="flex items-center border border-gray-200 rounded-2xl bg-gray-50 hover:bg-white transition-colors overflow-hidden">
            <button
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="px-4 py-3.5 text-gray-500 hover:text-gray-900 font-bold text-lg transition-colors"
            >
              −
            </button>
            <span className="flex-1 text-center font-bold text-gray-800">{guests}</span>
            <button
              onClick={() => setGuests(Math.min(12, guests + 1))}
              className="px-4 py-3.5 text-gray-500 hover:text-gray-900 font-bold text-lg transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Addons */}
      <div className="mb-5">
        <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">מה רוצים להוסיף לחבילה?</p>
        <div className="flex flex-wrap gap-2">
          {ADDONS.map((addon) => {
            const active = addons.includes(addon.id);
            return (
              <button
                key={addon.id}
                onClick={() => toggleAddon(addon.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                <span>{addon.icon}</span>
                {addon.label}
                {active && <span className="text-xs opacity-70">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search CTA */}
      <button className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-xl shadow-blue-300/40 flex items-center justify-center gap-2">
        <span>🔍</span>
        חפש חבילות זמינות
      </button>
    </div>
  );
}
