"use client";
import SkiLoader from "@/components/SkiLoader";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuoteView, { type QuoteData } from "@/components/QuoteView";

export default function ShortQuotePage() {
  const { slug } = useParams<{ slug: string[] }>();
  const [q, setQ] = useState<QuoteData | null>(null);
  const [notFound, setNotFound] = useState(false);

  // last path segment is the short id (e.g. /q/נבס-93/a7k2)
  const id = Array.isArray(slug) ? slug[slug.length - 1] : slug;

  useEffect(() => {
    if (!id) return;
    fetch(`/api/quotes/${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setQ({
        apartmentId: d.apartment_id ?? "",
        apartment:   d.apartment_name ?? "דירה",
        checkin:     d.checkin ?? "",
        checkout:    d.checkout ?? "",
        guests:      d.guests ?? 2,
        nights:      d.nights ?? 1,
        skiPass:     !!d.ski_pass,
        transfer:    !!d.transfer,
        cancel:      d.cancel ?? "none",
        service:     d.service ?? "human",
        aptTotal:    Number(d.apt_total ?? 0),
        grandTotal:  Number(d.grand_total ?? 0),
      }))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f9fb] text-center px-6" dir="rtl">
      <p className="text-5xl mb-4">🏔️</p>
      <h1 className="font-display text-2xl font-black text-slate-900 mb-2">ההצעה לא נמצאה</h1>
      <p className="text-slate-500 text-sm">ייתכן שהקישור פג תוקף. פנה אלינו לקבלת הצעה חדשה.</p>
      <a href="/" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">חזרה לאתר</a>
    </div>
  );

  if (!q) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
      <SkiLoader />
    </div>
  );

  return <QuoteView q={q} />;
}
