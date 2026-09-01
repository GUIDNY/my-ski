import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createServerClient } from "@/lib/supabase-server";
import type { Apartment } from "@/types";
import WeeklyBrowser from "@/components/WeeklyBrowser";
import { IconCheck, IconMountain, IconTicket } from "@/components/Icons";

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

  const allPrices = apartments.flatMap(a => (a.available_weeks ?? []).map(w => w.price));
  const fromPrice = allPrices.length ? Math.min(...allPrices) : null;
  const weekCount = new Set(apartments.flatMap(a => (a.available_weeks ?? []).map(w => w.week))).size;

  return (
    <div className="min-h-screen" style={{ background: "#f7f9fb" }} dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden" style={{ height: "48vh", minHeight: 380 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-ski.jpg" alt="Val Thorens" className="absolute inset-0 w-full h-full object-cover object-center" style={{ zIndex: 0 }} />
        <div className="absolute inset-0" style={{
          zIndex: 1,
          background: "linear-gradient(to bottom, rgba(10,20,35,0.55) 0%, rgba(10,20,35,0.25) 45%, rgba(10,20,35,0.7) 100%)",
        }} />
        <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center w-full max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-widest uppercase text-white/80">שכירות שבועית בואל טורנס</span>
          <h1 className="font-display text-3xl md:text-5xl font-black text-white leading-tight" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.35)" }}>
            דירות שבת עד שבת
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-lg leading-relaxed">
            מחיר לשבוע שלם — בוחרים שבוע פנוי, רואים איזה דירות זמינות ובאיזה מחיר, ומזמינים.
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <div className="max-w-6xl mx-auto px-5 md:px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 grid grid-cols-3 divide-x divide-x-reverse divide-gray-100 py-4">
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1"><IconMountain size={15} /></div>
            <div className="text-lg md:text-xl font-black text-gray-900">{apartments.length}</div>
            <div className="text-[11px] text-gray-500 font-medium">דירות זמינות</div>
          </div>
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1"><IconTicket size={15} /></div>
            <div className="text-lg md:text-xl font-black text-gray-900">{weekCount}</div>
            <div className="text-[11px] text-gray-500 font-medium">שבועות פתוחים</div>
          </div>
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1"><IconCheck size={15} /></div>
            <div className="text-lg md:text-xl font-black text-gray-900">{fromPrice ? `€${fromPrice.toLocaleString("en-US")}` : "-"}</div>
            <div className="text-[11px] text-gray-500 font-medium">החל מ-</div>
          </div>
        </div>
      </div>

      <div className="pt-8 pb-16 px-5 md:px-6 max-w-6xl mx-auto">
        <WeeklyBrowser apartments={apartments} />
      </div>
      <Footer />
    </div>
  );
}
