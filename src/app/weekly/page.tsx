import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createServerClient } from "@/lib/supabase-server";
import type { Apartment } from "@/types";
import { IconBed, IconMountain } from "@/components/Icons";
import WeeklyAvailability from "@/components/WeeklyAvailability";

export const metadata = { title: "שבת עד שבת — SkiShare" };
// Availability changes daily via the sync cron — this page has no
// searchParams to force dynamic rendering on its own, so without this it
// gets statically baked in at build time and never reflects the sync.
export const dynamic = "force-dynamic";

function ApartmentCard({ apt }: { apt: Apartment }) {
  const weeklyPrice = Math.round(apt.price_per_night * 7);
  const weeks = apt.available_weeks ?? [];

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
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
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><IconBed size={14} /> {apt.beds} חדרים</span>
          <span>{apt.sqm} מ״ר</span>
          <span>עד {apt.max_guests ?? "-"} אורחים</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-gray-900">€{weeklyPrice.toLocaleString("en-US")}</span>
          <span className="text-xs text-gray-400 font-medium">לשבוע</span>
        </div>
        <WeeklyAvailability weeks={weeks} />
      </div>
    </div>
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
          <span className="text-xs font-bold tracking-widest uppercase text-blue-600">שכירות שבועית בואל טורנס</span>
          <h1 className="font-display text-3xl md:text-5xl font-black text-gray-900 mt-2">דירות שבת עד שבת</h1>
          <p className="text-gray-500 text-sm md:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            מחיר לשבוע שלם, בלי צורך לבחור תאריך יום-יום — פשוט בוחרים שבוע פנוי ומזמינים.
            הזמינות מתעדכנת כל בוקר, כך שדירה שכבר הוזמנה לא תופיע כאן.
          </p>
        </div>

        {apartments.length === 0 ? (
          <div className="text-center text-gray-400 py-24 bg-white rounded-3xl border border-gray-100">
            אין כרגע דירות זמינות בקטגוריה זו — נסה שוב מאוחר יותר.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apartments.map(apt => <ApartmentCard key={apt.id} apt={apt} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
