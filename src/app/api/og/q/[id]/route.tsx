import { createServerClient } from "@/lib/supabase-server";
import { buildSiteProposal } from "@/lib/site-proposal";
import { quoteChoices } from "@/lib/quotes";
import { ogCard, proposalCard } from "@/lib/og-card";

export const runtime = "nodejs";
export const maxDuration = 30;

/* The link preview of a site quote (/q/<name>/<id>): see lib/og-card. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const xp = new URL(req.url).searchParams.get("x");
  const x = xp && /^[a-z0-9-]{1,60}$/i.test(xp) ? xp : null;
  if (!/^[a-z0-9]{4,12}$/i.test(id)) return new Response("not found", { status: 404 });
  const { data: q } = await createServerClient().from("quotes").select("*").eq("id", id).maybeSingle();
  if (!q) return new Response("not found", { status: 404 });
  const choices = quoteChoices(q, id, x);
  const r = await buildSiteProposal(k => choices[k] || "").catch(() => null);
  if (!r) return new Response("not found", { status: 404 });
  return ogCard(proposalCard(r.data));
}
