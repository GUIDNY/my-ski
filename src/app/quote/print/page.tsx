import type { Metadata } from "next";
import ProposalDocument, { PROPOSAL_CSS } from "@/components/ProposalDocument";
import { buildSiteProposal } from "@/lib/site-proposal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "הצעת מחיר — SkiShare", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;

/* The printable quote; /api/quote-pdf renders this page to a PDF file. */
export default async function QuotePrintPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const r = await buildSiteProposal(one);
  if (!r) return <div dir="rtl" style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>לא מצאנו את ההצעה.</div>;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROPOSAL_CSS }} />
      <div className="proposal-screen">
        <ProposalDocument data={r.data} />
      </div>
    </>
  );
}
