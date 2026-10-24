import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProposalDocument, { PROPOSAL_CSS, heroOf } from "@/components/ProposalDocument";
import { createServerClient } from "@/lib/supabase-server";
import type { ProposalData } from "@/types";

/*
 * A quote the bots made (WhatsApp / site chat), as a page: the same document
 * as the PDF, with a bar to pay, save the PDF or ask on WhatsApp.
 * The id is a random UUID that only the customer got.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "הצעת מחיר — SkiShare", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

export default async function ProposalPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createServerClient();
  const { data: row } = await db.from("proposals").select("id, data, proposal_number").eq("id", id).maybeSingle();
  if (!row?.data) notFound();
  const data = row.data as ProposalData;
  const h = heroOf(data);
  const pay = data.sections.flatMap(s => s.blocks).find(b => b.type === "payment" && b.url) as { url: string } | undefined;
  const wa = `https://wa.me/972555174903?text=${encodeURIComponent(`היי, לגבי הצעת המחיר${row.proposal_number ? ` ${row.proposal_number}` : ""}: `)}`;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROPOSAL_CSS }} />
      <div className="proposal-screen" style={{ paddingBottom: 110 }}>
        <ProposalDocument data={data} />
      </div>
      <div dir="rtl" className="fixed inset-x-0 bottom-0 z-[60] bg-white/95 backdrop-blur border-t border-line shadow-[0_-8px_30px_rgba(15,23,42,0.10)]">
        <div className="max-w-[820px] mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0 leading-tight">
            {h.perPerson && <p className="font-display font-extrabold text-[22px] text-ink">{h.perPerson} <span className="text-[14px] font-bold text-muted">לאדם</span></p>}
            {h.total && <p className="text-[13px] text-muted">סה״כ {h.total}</p>}
          </div>
          <a href={`/api/proposals/${id}/pdf`} className="shrink-0 inline-flex items-center min-h-[44px] px-4 rounded-full border border-line-strong font-bold text-[15px] text-ink">PDF</a>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center min-h-[44px] px-4 rounded-full bg-[#25D366] text-white font-bold text-[15px]">וואטסאפ</a>
          {pay && <a href={pay.url} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center min-h-[44px] px-5 rounded-full bg-accent text-white font-bold text-[15px]">לתשלום</a>}
        </div>
      </div>
    </>
  );
}
