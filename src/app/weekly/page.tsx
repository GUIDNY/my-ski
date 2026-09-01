import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createServerClient } from "@/lib/supabase-server";
import type { Apartment } from "@/types";
import { IconBed } from "@/components/Icons";

export const metadata = { title: "שבת עד שבת — SkiShare" };

function ApartmentCard({ apt }: { apt: Apartment }) {
  return (
    <a href={`/apartments/${apt.id}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {apt.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apt.images[0]} alt={apt.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-bold text-gray-900">{apt.name}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><IconBed size={14} /> {apt.beds} חדרים</span>
          <span>{apt.sqm} מ״ר</span>
          <span>עד {apt.max_guests ?? "-"} אורחים</span>
        </div>
        <div className="mt-auto pt-2 flex items-baseline justify-between">
          <span className="text-lg font-black text-gray-900">€{Math.round(apt.price_per_night)}</span>
          <span className="text-xs text-gray-400">ללילה</span>
        </div>
      </div>
    </a>
  );
}

export default async function WeeklyPage() {
  const db = createServerClient();
  const { data } = await db
    .from("apartments")
    .select("*")
    .eq("source", "la_cime")
    .eq("available", true)
    .order("price_per_night", { ascending: true });
  const apartments: Apartment[] = data ?? [];

  return (
    <div className="min-h-screen" style={{ background: "#f7f9fb" }} dir="rtl">
      <Navbar />
      <div className="pt-28 pb-16 px-5 md:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest uppercase text-blue-600">שבוע שלם בואל טורנס</span>
          <h1 className="font-display text-3xl md:text-4xl font-black text-gray-900 mt-2">דירות שבת עד שבת</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
            מבחר דירות זמינות לשבוע מלא (שבת עד שבת), מתעדכן מדי יום — דירה שכבר הוזמנה לא תוצג כאן.
          </p>
        </div>

        {apartments.length === 0 ? (
          <div className="text-center text-gray-400 py-20">אין כרגע דירות זמינות בקטגוריה זו — נסה שוב מאוחר יותר.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {apartments.map(apt => <ApartmentCard key={apt.id} apt={apt} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
