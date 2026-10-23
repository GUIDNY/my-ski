import { createServerClient } from "@/lib/supabase-server";
import { weekMins, type WeekPrices } from "@/lib/week-prices";

/** the open agency weeks now; null when the database doesn't answer */
export async function loadWeekPrices(): Promise<WeekPrices | null> {
  const { data, error } = await createServerClient().from("apartments").select("available_weeks")
    .eq("source", "la_cime").eq("available", true);
  if (error || !data) return null;
  const today = new Date().toISOString().slice(0, 10);
  return { asOf: today, weeks: weekMins(data as Parameters<typeof weekMins>[0], today) };
}
