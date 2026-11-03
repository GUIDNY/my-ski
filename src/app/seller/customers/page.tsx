"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { eur, dmy, showPhone, PageHead } from "@/components/seller-ui";

/*
 * The seller's customers: everyone he wrote to, everyone who ordered through him,
 * and people he added himself. A star keeps someone on top, a note is for him only.
 */
type Customer = {
  phone: string; name: string; seller: string; saved: boolean; note: string; addedAt: string;
  lead: string | null; channel: string | null; status: string | null; lastAt: string | null; lastMessage: string | null;
  orders: number; spent: number; share: number;
};

export default function SellerCustomers() {
  const [list, setList] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [add, setAdd] = useState({ name: "", phone: "", note: "" });
  const [msg, setMsg] = useState("");
  // Idan sees every seller's customers read-only (the stars and notes are the seller's)
  const [canEdit, setCanEdit] = useState(false);

  const load = useCallback(async () => {
    const j = await authFetch("/api/seller/customers").then(r => r.json()).catch(() => null);
    if (j?.ok) { setList(j.customers); setCanEdit(!!j.canEdit); }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const save = async (body: Record<string, unknown>) => {
    const r = await authFetch("/api/seller/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(x => x.json()).catch(() => null);
    if (!r?.ok) setMsg(r?.error === "phone" ? "צריך מספר טלפון תקין" : "לא נשמר");
    await load();
    return !!r?.ok;
  };

  const shown = (list ?? []).filter(c => (!onlySaved || c.saved) && (!q || [c.name, c.phone, c.note, c.lastMessage].some(v => String(v || "").toLowerCase().includes(q.toLowerCase()))));

  return (
    <div className="p-4 md:p-8 max-w-6xl" dir="rtl">
      <PageHead title="לקוחות" sub="כל מי שדיברת איתו או הזמין דרכך. כוכב שומר לקוח למעלה, וההערה רק בשבילך.">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => setOnlySaved(v => !v)} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${onlySaved ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-700 border-gray-200"}`}>⭐ רק שמורים</button>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש…"
            className="flex-1 md:w-[220px] rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
        </div>
      </PageHead>

      {canEdit && (
        <form onSubmit={async e => { e.preventDefault(); setMsg(""); if (await save({ ...add, saved: true })) { setAdd({ name: "", phone: "", note: "" }); setMsg("נוסף ✓"); } }}
          className="rounded-2xl border border-gray-200 bg-white p-3 mb-4 flex flex-wrap gap-2 items-center">
          <b className="text-sm ml-1">לקוח חדש:</b>
          <input value={add.name} onChange={e => setAdd(a => ({ ...a, name: e.target.value }))} placeholder="שם" className="flex-1 min-w-[120px] rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <input value={add.phone} onChange={e => setAdd(a => ({ ...a, phone: e.target.value }))} placeholder="טלפון" dir="ltr" inputMode="tel" className="w-[150px] rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <input value={add.note} onChange={e => setAdd(a => ({ ...a, note: e.target.value }))} placeholder="הערה" className="flex-[2] min-w-[160px] rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">הוספה</button>
          {msg && <span className="text-sm text-gray-600">{msg}</span>}
        </form>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white">
        {!list ? <p className="p-4 text-sm text-gray-500">טוען…</p> : shown.length === 0 ? <p className="p-4 text-sm text-gray-500">עוד אין לקוחות. כל לקוח שתכתוב לו מ״לידים וצ׳אטים״ יופיע כאן.</p> :
          shown.map(c => (
            <div key={c.phone || c.name} className="flex flex-col md:flex-row md:items-start gap-3 p-4 border-b border-gray-100">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button disabled={!canEdit || !c.phone} onClick={() => save({ phone: c.phone, saved: !c.saved })} aria-label="שמירה"
                  className={`text-xl leading-none ${c.saved ? "" : "grayscale opacity-30 hover:opacity-70"}`}>⭐</button>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900">{c.name || "ללא שם"}
                    {c.channel && <span className={`mr-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${c.channel === "web" ? "bg-sky-50 text-sky-700" : "bg-green-50 text-green-700"}`}>{c.channel === "web" ? "אתר" : "WhatsApp"}</span>}
                  </div>
                  <div className="text-xs text-gray-500" dir="ltr">{showPhone(c.phone)}</div>
                  {c.lastMessage && <div className="text-[13px] text-gray-600 truncate mt-1">״{c.lastMessage}״ <span className="text-gray-400">· {dmy(c.lastAt)}</span></div>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {c.phone && <a href={`https://wa.me/${c.phone}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-bold">וואטסאפ</a>}
                    {c.phone && <a href={`tel:+${c.phone}`} className="px-2.5 py-1 rounded-lg border border-gray-300 text-xs font-bold text-gray-700">התקשרות</a>}
                    {c.lead && <a href={`/seller/chats?lead=${encodeURIComponent(c.lead)}`} className="px-2.5 py-1 rounded-lg border border-gray-300 text-xs font-bold text-gray-700">השיחה</a>}
                  </div>
                </div>
              </div>
              <div className="text-sm md:text-left shrink-0">
                {c.orders > 0 ? <><div className="font-bold">{c.orders} הזמנות · {eur(c.spent)}</div><div className="text-amber-700 font-bold text-xs">שלך {eur(c.share)}</div></> : <div className="text-xs text-gray-400">עוד לא הזמין</div>}
              </div>
              <textarea key={`${c.phone}-${c.note}`} defaultValue={c.note} disabled={!canEdit || !c.phone} rows={2} placeholder="הערה (רק לך)…"
                onBlur={e => { if (e.target.value !== c.note) save({ phone: c.phone, note: e.target.value }); }}
                className="md:w-[260px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-50" />
            </div>
          ))}
      </div>
    </div>
  );
}
