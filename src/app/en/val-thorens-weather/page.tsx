import type { Metadata } from "next";
import WeatherPage from "@/components/WeatherPage";
import { pageMetadata } from "@/lib/intl/metadata";

export const revalidate = 1800;

export const metadata: Metadata = pageMetadata("en", "/val-thorens-weather", {
  title: "Val Thorens weather forecast: 10-day snow forecast | SkiShare",
  description: "Val Thorens weather forecast for 10 days, updated every 30 minutes: temperature in the village and at the top, snowfall, wind and freezing level.",
});

export default function Page() {
  return <WeatherPage lang="en" />;
}
