"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { dmy, eur, showPhone, PageHead } from "@/components/seller-ui";

/*
 * Idan's lead assignment: who handles which lead. A seller sees only the leads
 * assigned to him (and their quotes and orders). New leads can go to one seller by
 * themselves (auto-assign); every lead can be moved by hand, one by one or many at once.
 */
type Seller = { email: string; name: string; share: number };
type Lead = {
  lead: string; name: string; phone: string; channel: string; firstAt: string; lastAt: string; lastMessage: string;
  status: string; quotes: number; lastTotal: number; owner: string | null; by: "manual" | "touched" | "auto" | null;
};
type Res = { ok: boolean; sellers: Seller[]; autoAssign: { seller: string; since: string } | null; leads: Lead[] };

const BY: Record<string, string> = { manual: "שייכת ידנית", touched: "הוא כתב ללקוח", auto: "אוטומטי" };

export default function AssignLeads() {
  const [d, setD] = useState<Res | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<string>("none");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await authFetch("/api/seller/assign");
    const j = await r.json().catch(() => null);
    if (r.status === 403) { setErr("רק מנהל יכול לחלק לידים."); return; }
    if (!j?.ok) { setErr("לא הצלחתי לטעון את הלידים"); return; }
    setErr(""); setD(j);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const post = async (body: Record<string, unknown>, done: string) => {
    setBusy(true); setMsg("");
    const r = await authFetch("/api/seller/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(x => x.json()).catch(() => null);
    setBusy(false);
    setMsg(r?.ok ? done : "לא נשמר, נסה שוב");
    setSel(new Set());
    await load();
  };
  const nameOf = (email: string | null) => d?.sellers.find(s => s.email === email)?.name ?? "";

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, none: 0 };
    for (const l of d?.leads ?? []) { c.all++; const k = l.owner ?? "none"; c[k] = (c[k] ?? 0) + 1; }
    return c;
  }, [d]);
  const shown = (d?.leads ?? []).filter(l =>
    (tab === "all" || (tab === "none" ? !l.owner : l.owner === tab)) &&
    (!q || [l.name, l.phone, l.lastMessage].some(v => (v || "").toLowerCase().includes(q.toLowerCase()))));
  const allOn = shown.length > 0 && shown.every(l => sel.has(l.lead));
  const toggle = (id: string) => setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="p-4 md:p-8 max-w-6xl" dir="rtl">
      <PageHead title="חלוקת לידים" sub="כל איש מכירות רואה רק את הלידים שלו, את ההצעות שלהם ואת ההזמנות שלהם." />
      {err && <p className="mb-3 text-sm font-bold text-red-600">{err}</p>}

      {d && (
        <>
          {/* ── automatic ── */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="font-bold text-gray-900">לידים חדשים</div>
              <div className="text-sm text-gray-500">
                {d.autoAssign ? <>עוברים אוטומטית אל <b>{nameOf(d.autoAssign.seller)}</b> (מאז {dmy(d.autoAssign.since)}). מה שכבר קיים לא זז.</> : "לא עוברים לאף אחד לבד: אתה משייך כל ליד."}
              </div>
            </div>
            <select disabled={busy} value={d.autoAssign?.seller ?? ""} onChange={e => post({ autoAssign: e.target.value }, e.target.value ? "מעכשיו לידים חדשים עוברים אוטומטית" : "החלוקה האוטומטית כובתה")}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white font-bold">
              <option value="">אני משייך ידנית</option>
              {d.sellers.map(s => <option key={s.email} value={s.email}>אוטומטית אל {s.name}</option>)}
            </select>
          </div>

          {/* ── tabs ── */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {[["none", "לא משויכים"], ...d.sellers.map(s => [s.email, s.name]), ["all", "הכל"]].map(([k, label]) => (
              <button key={k} onClick={() => { setTab(k); setSel(new Set()); }}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border ${tab === k ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"} ${k === "none" && counts.none ? "ring-2 ring-orange-200" : ""}`}>
                {label} · {counts[k] ?? 0}
              </button>
            ))}
            <span className="flex-1" />
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש שם, טלפון, הודעה…"
              className="w-full md:w-[240px] rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>

          {/* ── bulk ── */}
          <div className={`sticky top-14 lg:top-0 z-10 rounded-2xl border p-3 mb-3 flex flex-wrap items-center gap-2 ${sel.size ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"}`}>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(shown.map(l => l.lead)))} className="w-4 h-4" />
              {sel.size ? `${sel.size} מסומנים` : "סמן הכל"}
            </label>
            {sel.size > 0 && (
              <>
                <span className="text-sm text-gray-600">שייך אל:</span>
                {d.sellers.map(s => <button key={s.email} disabled={busy} onClick={() => post({ leads: [...sel], seller: s.email }, `${sel.size} לידים שויכו אל ${s.name}`)} className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50">{s.name}</button>)}
                <button disabled={busy} onClick={() => post({ leads: [...sel], seller: "" }, "הוסרו מכל איש מכירות")} className="px-3 py-1.5 rounded-xl border border-gray-300 text-sm font-bold disabled:opacity-50">לאף אחד</button>
                <button disabled={busy} onClick={() => post({ leads: [...sel], seller: "auto" }, "חזרו לחלוקה האוטומטית")} className="px-3 py-1.5 rounded-xl text-sm text-gray-600 hover:underline disabled:opacity-50">אוטומטי</button>
              </>
            )}
            {msg && <span className="text-sm text-gray-700 mr-auto">{msg}</span>}
          </div>

          {/* ── list ── */}
          <div className="rounded-2xl border border-gray-200 bg-white">
            {shown.length === 0 ? <p className="p-4 text-sm text-gray-500">{tab === "none" ? "כל הלידים משויכים 👌" : "אין לידים כאן."}</p> : shown.map(l => (
              <div key={l.lead} className={`flex flex-col md:flex-row md:items-center gap-3 p-3.5 border-b border-gray-100 ${sel.has(l.lead) ? "bg-blue-50/60" : ""}`}>
                <label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer">
                  <input type="checkbox" checked={sel.has(l.lead)} onChange={() => toggle(l.lead)} className="w-4 h-4 mt-1 shrink-0" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 truncate">{l.name?.trim() || (l.channel === "web" ? "גולש באתר" : showPhone(l.phone))}</span>
                      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${l.channel === "web" ? "bg-sky-50 text-sky-700" : "bg-green-50 text-green-700"}`}>{l.channel === "web" ? "אתר" : "WhatsApp"}</span>
                    </span>
                    <span className="block text-[13px] text-gray-600 truncate mt-0.5">{l.lastMessage}</span>
                    <span className="block text-[11px] text-gray-400 mt-0.5">
                      {l.name?.trim() && l.phone ? <span dir="ltr">{showPhone(l.phone)}</span> : null}{l.name?.trim() && l.phone ? " · " : ""}
                      פנייה {l.firstAt.slice(0, 10).split("-").reverse().join(".")}{l.quotes ? ` · ${l.quotes} הצעות` : ""}{l.lastTotal ? ` · ${eur(l.lastTotal)}` : ""}
                    </span>
                  </span>
                </label>
                <div className="flex items-center gap-2 shrink-0">
                  {l.owner && <span className="text-[11px] text-gray-400">{BY[l.by ?? ""] ?? ""}</span>}
                  <select disabled={busy} value={l.owner ?? ""} onChange={e => post({ lead: l.lead, seller: e.target.value }, "נשמר")}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-bold bg-white ${l.owner ? "border-emerald-300 text-emerald-800" : "border-orange-300 text-orange-700"}`}>
                    <option value="">לא משויך</option>
                    {d.sellers.map(s => <option key={s.email} value={s.email}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {!d && !err && <p className="text-sm text-gray-500">טוען…</p>}
    </div>
  );
}
