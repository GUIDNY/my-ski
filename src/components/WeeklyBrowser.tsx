"use client";
import { useMemo, useState } from "react";
import type { Apartment } from "@/types";
import { IconBed, IconUsers, IconMountain, IconCalendar, IconBriefcase } from "@/components/Icons";

function fmtDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  const weekMinPrice = useMemo(() => {
    const map = new Map<string, number>();
    for (const apt of apartments) {
      for (const w of apt.available_weeks ?? []) {
        const cur = map.get(w.week);
        if (cur === undefined || w.price < cur) map.set(w.week, w.price);
      }
    }
    return map;
  }, [apartments]);

  const allWeeks = useMemo(
    () => [...weekMinPrice.keys()].sort(),
    [weekMinPrice]
  );

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
      {/* Explainer */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 md:p-5 mb-6 text-sm text-gray-700 leading-relaxed">
        הדירות כאן מוצעות לשבוע שלם (שבת עד שבת) ומתאימות במיוחד לחבילה מלאה — אפשר לבקש מאיתנו הצעת מחיר
        שכוללת גם טיסה, סקי פס והסעה, או פשוט להזמין את הדירה בלבד ולסדר את השאר בעצמכם. אנחנו מאמינים בגמישות
        ובחוויית לקוח נוחה.
      </div>

      {/* Week picker */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6 sticky top-20 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <IconCalendar size={16} className="text-blue-600" /> בחירת שבוע גלישה
          </div>
          {selected && <span className="text-[11px] font-semibold text-gray-400">{seasonLabel(selected)}</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
          {allWeeks.map(w => {
            const isSelected = selected === w;
            const minPrice = weekMinPrice.get(w);
            const checkin = new Date(w + "T12:00:00");
            const checkout = new Date(checkin);
            checkout.setDate(checkout.getDate() + 7);
            return (
              <div key={w}
                className={`rounded-xl border p-3 flex flex-col gap-2.5 transition-all ${
                  isSelected ? "border-blue-500 bg-blue-50/60 shadow-sm" : "border-gray-200 bg-white"
                }`}>
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
                  <span className="flex items-center gap-1"><IconBriefcase size={12} className="text-blue-500" /> כניסה: {fmtDate(checkin)}</span>
                  <span className="text-gray-300">←</span>
                  <span className="flex items-center gap-1">יציאה: {fmtDate(checkout)} <IconBriefcase size={12} className="text-blue-500" /></span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => setSelected(w)}
                    className={`flex-1 text-xs font-bold rounded-lg py-2 transition-colors ${
                      isSelected ? "bg-blue-600 text-white" : "bg-gray-900 text-white hover:bg-blue-600"
                    }`}>
                    {isSelected ? "השבוע שנבחר ✓" : "בחירה"}
                  </button>
                  {minPrice !== undefined && (
                    <div className="text-left shrink-0">
                      <div className="text-[9px] text-gray-400 font-medium leading-none mb-0.5">החל מ</div>
                      <div className="text-sm font-black text-gray-900 leading-none">€{minPrice.toLocaleString("en-US")}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
