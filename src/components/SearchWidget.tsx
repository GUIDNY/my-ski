"use client";
import { useState } from "react";

export default function SearchWidget() {
  const [dates, setDates] = useState("שבוע — כל הזמנים '26");
  const [guests, setGuests] = useState("2 אנשים");

  return (
    <div
      dir="rtl"
      className="bg-white w-full max-w-3xl flex items-stretch overflow-hidden"
      style={{ borderRadius: "16px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
    >
      {/* Destination */}
      <button className="flex-1 px-6 py-5 text-right hover:bg-gray-50 transition-colors group">
        <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">יעד</div>
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
            <path d="M3 17l3-8 3 4 4-6 3 5 3-3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-gray-900 font-semibold text-[15px]">Val Thorens</span>
        </div>
      </button>

      <div className="w-px bg-gray-200 my-4" />

      {/* Dates */}
      <button className="flex-1 px-6 py-5 text-right hover:bg-gray-50 transition-colors">
        <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">תאריכים</div>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span className="text-gray-600 font-medium text-[15px]">{dates}</span>
        </div>
      </button>

      <div className="w-px bg-gray-200 my-4" />

      {/* Guests */}
      <button className="flex-1 px-6 py-5 text-right hover:bg-gray-50 transition-colors">
        <div className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">אנשים</div>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="text-gray-600 font-medium text-[15px]">{guests}</span>
        </div>
      </button>

      {/* Search button */}
      <div className="flex items-center px-3">
        <button className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-7 py-4 transition-all flex items-center gap-2.5 text-[15px]" style={{ borderRadius: "12px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          חפש
        </button>
      </div>
    </div>
  );
}
