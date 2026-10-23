"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProposalDocument, { PROPOSAL_CSS } from "@/components/ProposalDocument";
import { DEMO_PROPOSAL } from "@/lib/proposal-demo";
import type { ProposalData } from "@/types";
import { authFetch } from "@/lib/auth-fetch";

export default function ProposalPrintPage() {
  const { id } = useParams<{ id: string }>();
  const isDemo = id === "demo";
  const [loaded, setLoaded] = useState<ProposalData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const data = isDemo ? DEMO_PROPOSAL : loaded;

  useEffect(() => {
    if (isDemo) return;
    authFetch(`/api/proposals/${id}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(p => setLoaded(p.data as ProposalData))
      .catch(() => setNotFound(true));
  }, [id, isDemo]);

  if (notFound) return <div dir="rtl" style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>ההצעה לא נמצאה.</div>;
  if (!data) return <div dir="rtl" style={{ padding: 40, textAlign: "center", fontFamily: "Arial" }}>טוען…</div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PROPOSAL_CSS }} />
      <div className="proposal-screen">
        <div className="no-print" style={{ maxWidth: "210mm", margin: "0 auto 14px", display: "flex", gap: 8, justifyContent: "flex-end" }} dir="rtl">
          <button onClick={() => window.print()}
            style={{ background: "#0B1B33", color: "#fff", border: "none", borderRadius: 12, padding: "11px 22px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            הדפסה / שמירה כ-PDF
          </button>
        </div>
        <ProposalDocument data={data} />
      </div>
    </>
  );
}
