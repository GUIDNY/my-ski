import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProposalView from "@/app/p/[id]/ProposalView";
import { createServerClient } from "@/lib/supabase-server";
import { buildSiteProposal } from "@/lib/site-proposal";
import { encodeExtras } from "@/lib/quote-extras";

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
  return {
    title: "הצעת מחיר — SkiShare",
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
  const guests = Number(q.guests) || 2;
  const x = extrasOf(await searchParams) ?? encodeExtras({
    ...(q.ski_pass ? { pass: { area: "val_thorens" as const, qty: guests } } : {}),
    ...(q.transfer ? { transfer: { qty: guests } } : {}),
    ...(q.equipment ? { equipment: { qty: guests } } : {}),
  });
  const choices: Record<string, string> = {
    apartment_id: String(q.apartment_id || ""), checkin: String(q.checkin || ""), checkout: String(q.checkout || ""),
    guests: String(guests), cancel: String(q.cancel || "regular"), service: String(q.service || "human"), x, q: id,
  };
  const r = await buildSiteProposal(k => choices[k] || "");
  if (!r) notFound();
  const pdfHref = `/api/quote-pdf?${new URLSearchParams({ ...Object.fromEntries(Object.entries(choices).filter(([, v]) => v)), name: String(q.apartment_name || "") }).toString()}`;
  return <ProposalView id={id} data={r.data} number={id} clientName={null} pdfHref={pdfHref} />;
}
