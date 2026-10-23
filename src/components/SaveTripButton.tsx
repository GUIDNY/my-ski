"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

// Heart button — saves an apartment (+ optional dates) to the user's personal area.
export default function SaveTripButton({
  apartmentId, extraApartmentId, checkin, checkout, guests, className, label,
}: { apartmentId: string; extraApartmentId?: string; checkin?: string; checkout?: string; guests?: number; className?: string; label?: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (saved) return;
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (confirm("כדי לשמור חופשה צריך להתחבר. לעבור להתחברות?")) window.location.href = "/auth";
      setBusy(false); return;
    }
    await fetch("/api/saved", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: session.user.id, apartment_id: apartmentId, extra_apartment_id: extraApartmentId, checkin, checkout, guests }),
    });
    setSaved(true); setBusy(false);
  };

  return (
    <button type="button" onClick={save} disabled={busy} aria-pressed={saved}
      className={className || "inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border border-line-strong bg-white hover:border-ink text-ink text-[15px] font-bold px-3.5 transition-colors"}
      aria-label={saved ? "החופשה נשמרה" : "שמירת החופשה"}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "#D92D20" : "none"} stroke={saved ? "#D92D20" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {label && <span>{saved ? "נשמר" : label}</span>}
    </button>
  );
}
