import { createServerClient } from "@/lib/supabase-server";
import type { Apartment, SkiPass } from "@/types";
import WeeklyBrowser from "@/components/WeeklyBrowser";
import { wrap, PageTop } from "@/components/ui";

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

  // The real adult ski-pass tiers (both areas), so "דיל שלם" folds actual
  // prices into the week prices: the pass that fits each week's dates.
  const { data: passOptions } = await db.from("ski_passes").select("*")
    .eq("available", true).eq("type", "adult")
    .order("duration_days", { ascending: true });
  const passes = (passOptions ?? []) as SkiPass[];

  return (
    <div className="flex-1 bg-white" dir="rtl">
      <PageTop
        soft
        crumbs={[{ label: "דף הבית", href: "/" }, { label: "שבת עד שבת" }]}
        title="שבת עד שבת"
        sub="דירות של הסוכנות לשבוע שלם, מכניסה בשבת עד שבת. בוחרים שבוע, רואים מה פנוי ובכמה, ומזמינים."
      />

      <div className={`${wrap} pt-6 md:pt-8 pb-16 md:pb-20`}>
        <WeeklyBrowser
          apartments={apartments}
          initialDeal={initialDeal}
          passes={passes}
        />
      </div>
    </div>
  );
}
