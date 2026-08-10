"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProposalDocument, { PROPOSAL_CSS } from "@/components/ProposalDocument";
import { DEMO_PROPOSAL } from "@/lib/proposal-demo";
import type { ProposalData } from "@/types";

export default function ProposalPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProposalData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id === "demo") { setData(DEMO_PROPOSAL); return; }
    fetch(`/api/proposals/${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(p => setData(p.data as ProposalData))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <div dir="rtl" style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>ההצעה לא נמצאה.</div>;
  if (!data) return <div dir="rtl" style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>טוען…</div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROPOSAL_CSS }} />
      <div className="proposal-screen">
        <div className="no-print" style={{ maxWidth: "210mm", margin: "0 auto 14px", display: "flex", gap: 8, justifyContent: "flex-end" }} dir="rtl">
          <button onClick={() => window.print()}
            style={{ background: "#1c2126", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 800, cursor: "pointer" }}>
            🖨️ הדפסה / שמירה כ-PDF
          </button>
        </div>
        <ProposalDocument data={data} />
      </div>
    </>
  );
}
