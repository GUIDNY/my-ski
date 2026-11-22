import { createServerClient } from "@/lib/supabase-server";
import { ogCard } from "@/lib/og-card";
import { aptKind, aptShortName, forWho, minWeekPrice, withListedSize } from "@/lib/apartment-display";
import type { Apartment } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;

/* The link preview of an apartment page (/apartments/<id>): its photos, name, size and price. See lib/og-card. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("not found", { status: 404 });
  const { data } = await createServerClient().from("apartments")
    .select("name, type, price_per_night, images, max_guests, sqm, source, available_weeks, description")
    .eq("id", id).maybeSingle();
  if (!data) return new Response("not found", { status: 404 });
  const a = withListedSize(data as Apartment);
  const agency = a.source === "la_cime";
  const week = agency ? minWeekPrice(a) : null;
  const night = !agency && Number(a.price_per_night) > 0 ? Number(a.price_per_night) : null;
  const who = forWho(a.max_guests);
  return ogCard({
    photos: [a.images?.[0] ?? "/view.jpg"],
    kicker: "דירה בואל טורנס · שלושת העמקים",
    title: aptShortName(a),
    facts: [agency ? null : aptKind(a), who ? `${who.replace(/^ל-?/, "עד ")}` : null, a.sqm ? `${a.sqm} מ״ר` : null].filter(Boolean).join(" · "),
    price: week ? { big: eur(week), unit: "לשבוע", sub: "מחיר התחלתי · שבת עד שבת" }
      : night ? { big: eur(night), unit: "ללילה", sub: "לכל הדירה · לפי התאריכים" } : null,
  }, 21600);
}
