"use client";
import { useState } from "react";

/*
 * A very quiet coupon entry for proposal pages: one small grey word at the
 * very bottom. Only someone who got a code from Idan will notice it; a valid
 * code answers with a fresh discounted payment link.
 */
export default function CouponCorner({ total, description, inline }: { total: number; description: string; inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState<{ discount: number; label: string; amount: number; url: string } | null>(null);
  if (!(total > 0)) return null;
  const apply = async () => {
    if (!code.trim()) return;
    setBusy(true); setErr("");
    try {
      const j = await fetch("/api/coupons/pay-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim(), total, description }) }).then(r => r.json());
      if (j.valid) setOk(j); else setErr("הקוד לא מוכר או שפג תוקפו");
    } catch { setErr("לא הצלחנו לבדוק את הקוד כרגע"); }
    setBusy(false);
  };
  return (
    <div dir="rtl" className={inline ? "pt-1" : "max-w-5xl mx-auto px-4 pb-6 pt-10 text-center"}>
      {ok ? (
        <div className="inline-flex flex-col items-center gap-2 rounded-2xl border border-line bg-soft px-5 py-4">
          <p className="text-[14px] font-bold text-ok-text">קופון הוחל: {ok.label} (−€{ok.discount.toLocaleString("en-US")})</p>
          <a href={ok.url} className="inline-flex items-center justify-center min-h-[46px] rounded-[14px] bg-accent hover:bg-accent-hover text-white font-bold text-[15px] px-6 transition-colors">
            לתשלום המעודכן — €{ok.amount.toLocaleString("en-US")}
          </a>
          <p className="text-[12px] text-muted">במקום €{total.toLocaleString("en-US")}</p>
        </div>
      ) : open ? (
        <div className="inline-flex items-center gap-2">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="קוד" dir="ltr" autoFocus
            onKeyDown={e => { if (e.key === "Enter") apply(); }}
            className="w-32 min-h-[40px] rounded-xl border border-line-strong bg-white px-3 text-[14px] text-left focus:outline-none focus:border-accent" />
          <button type="button" onClick={apply} disabled={busy}
            className="min-h-[40px] rounded-xl border border-line-strong px-3.5 text-[13px] font-bold text-body hover:border-ink disabled:opacity-50">
            {busy ? "…" : "החלה"}
          </button>
          {err && <span className="text-[12px] text-danger">{err}</span>}
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className="text-[11px] text-muted/50 hover:text-muted transition-colors">{inline ? "יש קוד?" : "קוד"}</button>
      )}
    </div>
  );
}
