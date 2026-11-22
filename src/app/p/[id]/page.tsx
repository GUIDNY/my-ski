import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProposalView from "./ProposalView";
import AdminProfit from "./AdminProfit";
import { createServerClient } from "@/lib/supabase-server";
import type { ProposalData } from "@/types";

/*
 * A quote the bots made (WhatsApp / site chat), as a page in the site's look.
 * The id is a random UUID that only the customer got.
 */
export const dynamic = "force-dynamic";
// the link preview: the quote's photos, dates and price per person (lib/og-card)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const base: Metadata = { title: "הצעת מחיר — SkiShare", robots: { index: false, follow: false } };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return base;
  const { data: row } = await createServerClient().from("proposals").select("data").eq("id", id).maybeSingle();
  const d = row?.data as ProposalData | undefined;
  if (!d) return base;
  const title = `הצעת מחיר: ${d.title}`;
  const description = d.subtitle || "הצעת מחיר אישית לחופשת סקי בואל טורנס";
  const og = `https://skisharebook.com/api/og/p/${id}`;
  return {
    ...base, title, description,
    openGraph: { title, description, images: [{ url: og, width: 1200, height: 630, type: "image/jpeg" }], type: "website", siteName: "SkiShare", locale: "he_IL" },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

type Props = { params: Promise<{ id: string }> };

export default async function ProposalPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createServerClient();
  const { data: row } = await db.from("proposals").select("id, data, proposal_number, client_name").eq("id", id).maybeSingle();
  if (!row?.data) notFound();
  return (
    <>
      <ProposalView id={id} data={row.data as ProposalData} number={row.proposal_number ?? null} clientName={row.client_name ?? null} />
      <AdminProfit id={id} />
    </>
  );
}
