import type { Metadata } from "next";
import ComboClient from "./ComboClient";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

// the link preview: both apartments' photos, the dates and the price per person (/api/og/combo, lib/og-card)
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const k of ["a", "b", "checkin", "checkout", "guests"]) if (one(sp[k])) q.set(k, one(sp[k]).slice(0, 40));
  const og = `https://skisharebook.com/api/og/combo?${q.toString()}`;
  const title = "שתי דירות יחד בואל טורנס — SkiShare";
  const description = "הזמנה אחת לשתי דירות, עם סקי פס, הסעה וציוד. כל אחד משלם את החלק שלו.";
  return {
    title, description,
    openGraph: { title, description, images: [{ url: og, width: 1200, height: 630, type: "image/jpeg" }], type: "website", siteName: "SkiShare", locale: "he_IL" },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default function ComboPage() {
  return <ComboClient />;
}
