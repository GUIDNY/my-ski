import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProposalView from "@/app/p/[id]/ProposalView";
import AdminProfitBadge from "@/components/AdminProfitBadge";
import { createServerClient } from "@/lib/supabase-server";
import { buildSiteProposal } from "@/lib/site-proposal";
import { quoteChoices } from "@/lib/quotes";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";
const idOf = (slug: string[] | string) => (Array.isArray(slug) ? slug[slug.length - 1] : slug) ?? "";
const extrasOf = (sp: Record<string, string | string[] | undefined>) => (typeof sp.x === "string" && /^[a-z0-9-]{1,60}$/i.test(sp.x) ? sp.x : null);

// A personal link: not for search results. On iPhone, Safari's own app banner
// opens this same quote in the app (app-argument) when the app is installed.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const id = idOf((await params).slug);
  const x = extrasOf(await searchParams);
  // the link preview (WhatsApp, iMessage): the apartments' photos, dates and price, drawn by /api/og/q/<id>
  let title = "הצעת מחיר — SkiShare", description = "הצעת מחיר אישית לחופשת סקי בואל טורנס";
  if (/^[a-z0-9]{4,12}$/i.test(id)) {
    const { data: q } = await createServerClient().from("quotes").select("apartment_name,checkin,checkout,guests").eq("id", id).maybeSingle();
    if (q) {
      const dm = (iso: string) => { const d = new Date(iso + "T12:00:00"); return `${d.getDate()}.${d.getMonth() + 1}`; };
      title = `הצעת מחיר: ${q.apartment_name}`;
      description = `ואל טורנס · ${q.checkin && q.checkout ? `${dm(q.checkin)}–${dm(q.checkout)} · ` : ""}${q.guests} אנשים · דירה, סקי פס, הסעה וציוד`;
    }
  }
  const og = `https://skisharebook.com/api/og/q/${encodeURIComponent(id)}${x ? `?x=${x}` : ""}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: og, width: 1200, height: 630, type: "image/jpeg" }], type: "website", siteName: "SkiShare", locale: "he_IL" },
    twitter: { card: "summary_large_image", title, description, images: [og] },
    robots: { index: false, follow: false },
    itunes: { appId: "6782095727", appArgument: `https://skisharebook.com/q/${encodeURIComponent(id)}${x ? `?x=${x}` : ""}` },
  };
}

/*
 * A quote made on the site (/q/<name>/<id>), in the same look as the quotes
 * the WhatsApp bot sends (/p/<id>): priced on the server from live data.
 */
export default async function ShortQuotePage({ params, searchParams }: Props) {
  const id = idOf((await params).slug);
  if (!/^[a-z0-9]{4,12}$/i.test(id)) notFound();
  const db = createServerClient();
  const { data: q } = await db.from("quotes").select("*").eq("id", id).maybeSingle();
  if (!q) notFound();
  const choices = quoteChoices(q, id, extrasOf(await searchParams));
  const r = await buildSiteProposal(k => choices[k] || "");
  if (!r) notFound();
  const pdfHref = `/api/quote-pdf?${new URLSearchParams({ ...Object.fromEntries(Object.entries(choices).filter(([, v]) => v)), name: String(q.apartment_name || "") }).toString()}`;
  return (
    <>
      <ProposalView id={id} data={r.data} number={id} clientName={null} pdfHref={pdfHref} />
      {/* admin-only: the profit behind this quote (nothing renders for customers) */}
      <AdminProfitBadge quoteId={id} body={{ apartment_id: String(q.apartment_id || ""), apartment: String(q.apartment_name || ""), nights: r.profitHints.nights, aptTotal: r.profitHints.aptTotal, flightQty: r.profitHints.flightQty }} />
    </>
  );
}
