import { createServerClient } from "@/lib/supabase-server";
import { ogCard } from "@/lib/og-card";
import { aptKind, aptShortName, forWho, withListedSize } from "@/lib/apartment-display";
import type { Apartment } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;


/* The link preview of an apartment page (/apartments/<id>): its photo, name and size (no price). See lib/og-card. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("not found", { status: 404 });
  const { data } = await createServerClient().from("apartments")
    .select("name, type, images, max_guests, sqm, source, description")
    .eq("id", id).maybeSingle();
  if (!data) return new Response("not found", { status: 404 });
  const a = withListedSize(data as Apartment);
  const agency = a.source === "la_cime";
  const who = forWho(a.max_guests);
  return ogCard({
    photos: [a.images?.[0] ?? "/view.jpg"],
    kicker: "דירה בואל טורנס · שלושת העמקים",
    title: aptShortName(a),
    facts: [agency ? null : aptKind(a), who ? `${who.replace(/^ל-?/, "עד ")}` : null, a.sqm ? `${a.sqm} מ״ר` : null].filter(Boolean).join(" · "),
    cta: "לתמונות ולזמינות",
  }, 21600);
}
