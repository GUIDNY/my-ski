import type { Metadata } from "next";
import WeatherPage from "@/components/WeatherPage";
import { pageMetadata } from "@/lib/intl/metadata";

export const revalidate = 1800;

export const metadata: Metadata = pageMetadata("fr", "/val-thorens-weather", {
  title: "Météo Val Thorens : prévisions neige à 10 jours | SkiShare",
  description: "Météo de Val Thorens à 10 jours, mise à jour toutes les 30 minutes : températures au village et au sommet, chutes de neige, vent et isotherme 0 °C.",
});

export default function Page() {
  return <WeatherPage lang="fr" />;
}
