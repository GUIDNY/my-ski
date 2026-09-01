"use client";
import { useMemo, useState } from "react";
import type { Apartment } from "@/types";
import { IconBed, IconUsers, IconMountain, IconCalendar, IconCheck } from "@/components/Icons";

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

function seasonLabel(iso: string) {
  const y = new Date(iso + "T12:00:00").getMonth() >= 7 ? new Date(iso).getFullYear() : new Date(iso).getFullYear() - 1;
  return `עונת ${y}/${String(y + 1).slice(2)}`;
}

function SpecChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 text-[11px] font-semibold text-gray-600">
      {icon} {label}
    </span>
  );
}

export default function WeeklyBrowser({ apartments }: { apartments: Apartment[] }) {
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6 sticky top-20 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <IconCalendar size={16} className="text-blue-600" /> בחירת שבוע גלישה
          </div>
          {selected && <span className="text-[11px] font-semibold text-gray-400">{seasonLabel(selected)}</span>}
        </div>
        <div className="relative -mx-1">
          <div className="flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}>
            {allWeeks.map(w => {
              const isSelected = selected === w;
              return (
                <button key={w} onClick={() => setSelected(w)}
                  className={`flex-shrink-0 snap-start flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold border transition-all ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                  }`}>
                  {isSelected && <IconCheck size={13} />}
                  {fmtWeek(w)}
                </button>
              );
            })}
          </div>
          {/* edge fade hinting more content on scroll */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>

      {/* Results line */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm font-bold text-gray-900">{visible.length} דירות זמינות לשבוע זה</span>
      </div>

      {/* Apartments for the selected week */}
      {visible.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-3xl border border-gray-100">
          אין דירות פנויות בשבוע הזה — נסה שבוע אחר.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map(({ apt, price }) => (
            <div key={apt.id}
              className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {apt.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={apt.images[0]} alt={apt.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mb-1">
                  <IconMountain size={11} className="text-blue-500" /> Val Thorens
                </div>
                <h3 className="font-display font-bold text-base text-gray-900 mb-2 leading-tight">{apt.name}</h3>
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <SpecChip icon={<IconUsers size={12} />} label={`עד ${apt.max_guests ?? "-"}`} />
                  <SpecChip icon={<IconBed size={12} />} label={`${apt.beds} חדרים`} />
                  <SpecChip icon={null} label={`${apt.sqm} מ״ר`} />
                </div>
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                  <a href={`/apartments/${apt.id}`}
                    className="bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-colors">
                    צפייה בדירה
                  </a>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400 font-medium">לשבוע</div>
                    <div className="text-lg font-black text-gray-900">€{price.toLocaleString("en-US")}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
