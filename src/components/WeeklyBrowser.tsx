"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Apartment } from "@/types";
import { IconBed, IconUsers, IconMountain, IconCalendar, IconBriefcase, IconCheck } from "@/components/Icons";

const MONTHS_FULL = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function fmtDate(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtFull(d: Date) {
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;
}

function weekRange(iso: string) {
  const checkin = new Date(iso + "T12:00:00");
  const checkout = new Date(checkin);
  checkout.setDate(checkout.getDate() + 7);
  return { checkin, checkout };
}

const TIER_STYLE: Record<"cheap" | "mid" | "expensive", string> = {
  cheap: "bg-green-50 text-green-700",
  mid: "bg-gray-100 text-gray-500",
  expensive: "bg-orange-50 text-orange-700",
};
const TIER_LABEL: Record<"cheap" | "mid" | "expensive", string> = {
  cheap: "זול",
  mid: "ממוצע",
  expensive: "יקר",
};

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

  const priceTier = useMemo(() => {
    const sorted = allWeeks.map(w => weekMinPrice.get(w)!).sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length / 3)];
    const q2 = sorted[Math.floor((sorted.length * 2) / 3)];
    const tier = new Map<string, "cheap" | "mid" | "expensive">();
    for (const w of allWeeks) {
      const p = weekMinPrice.get(w)!;
      tier.set(w, p <= q1 ? "cheap" : p >= q2 ? "expensive" : "mid");
    }
    return tier;
  }, [allWeeks, weekMinPrice]);

  const [selected, setSelected] = useState<string | null>(allWeeks[0] ?? null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

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

      {/* Week picker — cloned from the homepage search bar */}
      <div ref={ref} className="relative mb-6 sticky top-20 z-20">
        {(() => {
          const range = selected ? weekRange(selected) : null;
          const price = selected ? weekMinPrice.get(selected) : undefined;
          return (
            <>
              {/* ══ DESKTOP bar (md+) ══════════════════════════ */}
              <div className="hidden md:flex bg-white items-stretch rounded-2xl" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
                <div className="flex-1 px-6 py-5 text-right">
                  <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">יעד</div>
                  <div className="flex items-center gap-2">
                    <IconMountain size={16} className="text-blue-500" />
                    <span className="text-gray-900 font-bold text-sm">Val Thorens</span>
                  </div>
                </div>
                <div className="w-px bg-gray-100 my-4" />
                <button onClick={() => setOpen(o => !o)}
                  className={`flex-1 px-5 py-5 text-right transition-colors hover:bg-gray-50 ${open ? "bg-blue-50/60" : ""}`}>
                  <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">כניסה</div>
                  <div className="flex items-center gap-2">
                    <IconCalendar size={14} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{range ? fmtFull(range.checkin) : "בחר שבוע"}</span>
                  </div>
                </button>
                <div className="w-px bg-gray-100 my-4" />
                <button onClick={() => setOpen(o => !o)}
                  className={`flex-1 px-5 py-5 text-right transition-colors hover:bg-gray-50 ${open ? "bg-blue-50/60" : ""}`}>
                  <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">יציאה</div>
                  <div className="flex items-center gap-2">
                    <IconCalendar size={14} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{range ? fmtFull(range.checkout) : "-"}</span>
                  </div>
                  <div className="text-[10px] text-blue-500 font-bold mt-0.5">7 לילות</div>
                </button>
                <div className="w-px bg-gray-100 my-4" />
                <div className="flex items-center px-5 py-5">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1.5">מחיר</div>
                    {price !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-gray-900 text-base">€{price.toLocaleString("en-US")}</span>
                        {selected && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TIER_STYLE[priceTier.get(selected) ?? "mid"]}`}>{TIER_LABEL[priceTier.get(selected) ?? "mid"]}</span>}
                      </div>
                    ) : <span className="text-gray-400 text-sm">-</span>}
                  </div>
                </div>
                <div className="flex items-center px-3">
                  <button onClick={() => setOpen(o => !o)}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-7 py-4 rounded-xl transition-all flex items-center gap-2 text-sm">
                    <IconCalendar size={16} className="text-white" />
                    בחירת שבוע
                  </button>
                </div>
              </div>

              {/* ══ MOBILE bar (< md) ══════════════════════════ */}
              <div className="md:hidden bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
                  <IconMountain size={16} className="text-blue-500" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">יעד</div>
                    <div className="text-sm font-bold text-gray-900">Val Thorens</div>
                  </div>
                </div>
                <button onClick={() => setOpen(o => !o)}
                  className={`w-full grid grid-cols-2 border-b border-gray-100 text-right transition-colors ${open ? "bg-blue-50/60" : "hover:bg-gray-50"}`}>
                  <div className="px-5 py-3.5 border-l border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">כניסה</div>
                    <div className="flex items-center gap-1.5">
                      <IconCalendar size={13} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{range ? fmtFull(range.checkin) : "בחר"}</span>
                    </div>
                  </div>
                  <div className="px-5 py-3.5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">יציאה</div>
                    <div className="flex items-center gap-1.5">
                      <IconCalendar size={13} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{range ? fmtFull(range.checkout) : "-"}</span>
                    </div>
                  </div>
                </button>
                <div className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">מחיר</div>
                    {price !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-gray-900 text-sm">€{price.toLocaleString("en-US")}</span>
                        {selected && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TIER_STYLE[priceTier.get(selected) ?? "mid"]}`}>{TIER_LABEL[priceTier.get(selected) ?? "mid"]}</span>}
                      </div>
                    ) : <span className="text-gray-400 text-sm">-</span>}
                  </div>
                  <button onClick={() => setOpen(o => !o)} className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm">
                    <IconCalendar size={14} className="text-white" />
                    בחירת שבוע
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {/* ══ Week dropdown ══════════════════════════════════ */}
        {open && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto p-2 md:p-3"
            style={{ boxShadow: "0 16px 50px rgba(0,0,0,0.18)" }}>
            {allWeeks.map(w => {
              const isSelected = selected === w;
              const price = weekMinPrice.get(w);
              const tier = priceTier.get(w) ?? "mid";
              const { checkin, checkout } = weekRange(w);
              return (
                <button key={w} onClick={() => { setSelected(w); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-right transition-colors ${
                    isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <IconBriefcase size={12} className="text-blue-500 shrink-0" />
                    כניסה {fmtDate(checkin)} ← יציאה {fmtDate(checkout)}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${TIER_STYLE[tier]}`}>{TIER_LABEL[tier]}</span>
                    {price !== undefined && <span className="text-sm font-black text-gray-900">€{price.toLocaleString("en-US")}</span>}
                    {isSelected && <IconCheck size={14} className="text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
