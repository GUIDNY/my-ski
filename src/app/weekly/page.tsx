import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createServerClient } from "@/lib/supabase-server";
import { TRANSFER_PRICE, FLIGHT_ESTIMATE, skiPassPerPersonForWeek } from "@/lib/deal-pricing";
import type { Apartment, SkiPass } from "@/types";
import WeeklyBrowser from "@/components/WeeklyBrowser";

export const metadata = { title: "שבת עד שבת — SkiShare" };
// Availability + pricing change daily via the sync cron — this page has no
// searchParams to force dynamic rendering on its own, so without this it
// gets statically baked in at build time and never reflects the sync.
export const dynamic = "force-dynamic";

export default async function WeeklyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const initialDeal = params.deal === "full" ? "full" : "apartment";
  const db = createServerClient();
  const { data } = await db
    .from("apartments")
    .select("*")
    .eq("source", "la_cime")
    .eq("available", true)
    .order("price_per_night", { ascending: true });
  const apartments: Apartment[] = data ?? [];

  // Real Trois Vallées ski-pass tier for a full La Cime week, so the
  // "דיל שלם" toggle folds an actual price (not a guess) into the totals
  // shown in WeeklyBrowser — same source used on the homepage packages.
  const { data: passOptions } = await db.from("ski_passes").select("*")
    .eq("available", true).eq("type", "adult").eq("area", "trois_vallees")
    .order("duration_days", { ascending: true });
  const skiPassPerPerson = skiPassPerPersonForWeek(passOptions as SkiPass[] | null);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(to bottom, #f7f9fb, #eef2f7)" }} dir="rtl">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden" style={{ height: "52vh", minHeight: 420 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-ski.jpg" alt="Val Thorens" className="absolute inset-0 w-full h-full object-cover object-center scale-105" style={{ zIndex: 0 }} />
        <div className="absolute inset-0" style={{
          zIndex: 1,
          background: "linear-gradient(to bottom, rgba(10,20,35,0.6) 0%, rgba(10,20,35,0.2) 45%, rgba(10,20,35,0.75) 100%)",
        }} />
        <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center w-full max-w-2xl mx-auto">
          <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-white bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5">
            ✨ שכירות שבועית בואל טורנס
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-black text-white leading-tight" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.35)" }}>
            דירות שבת עד שבת
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-lg leading-relaxed">
            מחיר לשבוע שלם — בוחרים שבוע פנוי, רואים איזה דירות זמינות ובאיזה מחיר, ומזמינים.
          </p>
        </div>
      </section>

      <div className="pt-8 pb-16 px-5 md:px-6 max-w-6xl mx-auto">
        <WeeklyBrowser
          apartments={apartments}
          initialDeal={initialDeal}
          skiPassPerPerson={skiPassPerPerson}
          transferPrice={TRANSFER_PRICE}
          flightEstimate={FLIGHT_ESTIMATE}
        />
      </div>
      <Footer />
    </div>
  );
}
