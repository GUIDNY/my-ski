import { createServerClient } from "@/lib/supabase-server";
import { PUBLIC_APARTMENT_COLUMNS } from "@/lib/apartment-fields";
import { pageMeta } from "@/lib/page-meta";
import { withListedSize } from "@/lib/apartment-display";
import { breadcrumbLd, ldJson } from "@/lib/site";
import type { Apartment, SkiPass } from "@/types";
import WeeklyBrowser from "@/components/WeeklyBrowser";
import WeeklyGuide from "./WeeklyGuide";
import { wrap, PageTop } from "@/components/ui";

export const metadata = pageMeta({
  title: "דירות שבת עד שבת בואל טורנס: מחיר לכל שבוע בעונה | SkiShare",
  description: "כמה עולה דירה בואל טורנס בכל שבוע של עונת 2026/27? בוחרים שבת, רואים מה פנוי ובכמה, ומזמינים רק דירה או עם סקי פס, הסעה וציוד. מחיר לאדם.",
  path: "/weekly",
});
// Availability + pricing change daily via the sync cron — this page has no
// searchParams to force dynamic rendering on its own, so without this it
// gets statically baked in at build time and never reflects the sync.
export const dynamic = "force-dynamic";

export default async function WeeklyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const initialDeal = params.deal === "full" ? "full" : "apartment";
  const week = typeof params.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : null;
  const db = createServerClient();
  // only the public fields: the page sends the list to the browser
  const { data } = await db
    .from("apartments")
    .select(PUBLIC_APARTMENT_COLUMNS)
    .eq("source", "la_cime")
    .eq("available", true)
    .order("price_per_night", { ascending: true });
  const apartments = ((data ?? []) as unknown as Apartment[]).map(withListedSize);

  // The real adult ski-pass tiers (both areas), so "דיל שלם" folds actual
  // prices into the week prices: the pass that fits each week's dates.
  const { data: passOptions } = await db.from("ski_passes").select("*")
    .eq("available", true).eq("type", "adult")
    .order("duration_days", { ascending: true });
  const passes = (passOptions ?? []) as SkiPass[];

  return (
    <div className="flex-1 bg-white" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd([["דף הבית", "/"], ["דירות שבת עד שבת", "/weekly"]])) }} />
      <PageTop
        soft
        crumbs={[{ label: "דף הבית", href: "/" }, { label: "שבת עד שבת" }]}
        title="דירות שבת עד שבת בואל טורנס"
        sub="דירות של סוכנות מקומית לשבוע שלם, מכניסה בשבת עד שבת. בוחרים שבוע, רואים מה פנוי ובכמה, ומזמינים."
      />

      <div className={`${wrap} pt-6 md:pt-8 pb-16 md:pb-20`}>
        <WeeklyBrowser
          apartments={apartments}
          initialDeal={initialDeal}
          initialWeek={week}
          passes={passes}
        />
        <WeeklyGuide apartments={apartments} />
      </div>
    </div>
  );
}
