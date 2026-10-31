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
export const metadata: Metadata = { title: "הצעת מחיר — SkiShare", robots: { index: false, follow: false } };

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
