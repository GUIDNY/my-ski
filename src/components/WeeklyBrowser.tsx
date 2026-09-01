"use client";
import { useMemo, useState } from "react";
import type { Apartment } from "@/types";
import { IconBed, IconMountain, IconCalendar } from "@/components/Icons";

const HE_MONTHS_SHORT = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יונ׳", "יול׳", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"];

function fmtWeek(iso: string) {
  const start = new Date(iso + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${start.getDate()}–${end.getDate()} ב${HE_MONTHS_SHORT[start.getMonth()]}`
    : `${start.getDate()} ב${HE_MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ב${HE_MONTHS_SHORT[end.getMonth()]}`;
}

export default function WeeklyBrowser({ apartments }: { apartments: Apartment[] }) {
  // Union of every week any apartment has open, sorted chronologically.
  const allWeeks = useMemo(() => {
    const set = new Set<string>();
    for (const apt of apartments) for (const w of apt.available_weeks ?? []) set.add(w.week);
    return [...set].sort();
  }, [apartments]);

  const [selected, setSelected] = useState<string | null>(allWeeks[0] ?? null);

  const visible = useMemo(() => {
    if (!selected) return [];
    return apartments
      .map(apt => {
        const match = (apt.available_weeks ?? []).find(w => w.week === selected);
        return match ? { apt, price: match.price } : null;
      })
      .filter((x): x is { apt: Apartment; price: number } => x !== null)
      .sort((a, b) => a.price - b.price);
  }, [apartments, selected]);

  if (!allWeeks.length) {
    return (
      <div className="text-center text-gray-400 py-24 bg-white rounded-3xl border border-gray-100">
        אין כרגע דירות זמינות בקטגוריה זו — נסה שוב מאוחר יותר.
      </div>
    );
  }

  return (
    <div>
      {/* Week picker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8 sticky top-20 z-10">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <IconCalendar size={14} /> בחר שבוע
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "thin" }}>
          {allWeeks.map(w => (
            <button key={w} onClick={() => setSelected(w)}
              className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold border transition-colors ${
                selected === w
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
              }`}>
              {fmtWeek(w)}
            </button>
          ))}
        </div>
      </div>

      {/* Apartments for the selected week */}
      {visible.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-100">
          אין דירות פנויות בשבוע הזה — נסה שבוע אחר.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map(({ apt, price }) => (
            <div key={apt.id}
              className="group bg-white rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {apt.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={apt.images[0]} alt={apt.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur rounded-full px-3 py-1 text-[11px] font-bold text-gray-700 flex items-center gap-1 shadow-sm">
                  <IconMountain size={12} className="text-blue-600" /> Val Thorens
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-display font-bold text-lg text-gray-900 mb-1.5">{apt.name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><IconBed size={14} /> {apt.beds} חדרים</span>
                  <span>{apt.sqm} מ״ר</span>
                  <span>עד {apt.max_guests ?? "-"} אורחים</span>
                </div>
                <div className="mt-auto flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-gray-900">€{price.toLocaleString("en-US")}</span>
                  <span className="text-xs text-gray-400 font-medium">לשבוע · {fmtWeek(selected!)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
