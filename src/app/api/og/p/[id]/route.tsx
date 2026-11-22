import { createServerClient } from "@/lib/supabase-server";
import { ogCard, proposalCard } from "@/lib/og-card";
import type { ProposalData } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/* The link preview of a quote the bots made (/p/<id>): see lib/og-card. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("not found", { status: 404 });
  const { data: row } = await createServerClient().from("proposals").select("data").eq("id", id).maybeSingle();
  if (!row?.data) return new Response("not found", { status: 404 });
  return ogCard(proposalCard(row.data as ProposalData));
}
