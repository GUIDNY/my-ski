import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createServerClient } from "@/lib/supabase-server";
import type { Apartment } from "@/types";
import WeeklyBrowser from "@/components/WeeklyBrowser";

export const metadata = { title: "שבת עד שבת — SkiShare" };
// Availability + pricing change daily via the sync cron — this page has no
// searchParams to force dynamic rendering on its own, so without this it
// gets statically baked in at build time and never reflects the sync.
export const dynamic = "force-dynamic";

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
            מחיר לשבוע שלם — בוחרים שבוע פנוי, רואים איזה דירות זמינות ובאיזה מחיר, ומזמינים.
            הזמינות והמחירים מתעדכנים כל בוקר, כך שדירה שכבר הוזמנה לא תופיע כאן.
          </p>
        </div>

        <WeeklyBrowser apartments={apartments} />
      </div>
      <Footer />
    </div>
  );
}
