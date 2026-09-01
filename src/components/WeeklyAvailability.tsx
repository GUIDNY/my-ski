"use client";
import { useState } from "react";
import { IconCalendar, IconChevronLeft } from "@/components/Icons";

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

export default function WeeklyAvailability({ weeks }: { weeks: string[] }) {
  const [open, setOpen] = useState(false);
  if (!weeks.length) return null;

  return (
    <div className="border-t border-gray-100 pt-3 mt-3">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-sm font-bold text-blue-700 hover:text-blue-800">
        <span className="flex items-center gap-1.5">
          <IconCalendar size={15} /> {weeks.length} שבועות פנויים
        </span>
        <IconChevronLeft size={14} className={`transition-transform duration-200 ${open ? "-rotate-90" : "rotate-180"}`} />
      </button>
      {open && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {weeks.map(w => (
            <span key={w} className="text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
              {fmtWeek(w)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
