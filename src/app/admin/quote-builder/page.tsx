"use client";
import { useState } from "react";
import AdminGate from "@/components/AdminGate";
import { authFetch } from "@/lib/auth-fetch";

/*
 * Admin quote builder for groups: pick the dates, see every free apartment with the price we'd
 * sell it at, tick the ones you want together (as many as you like), and build a quote with them.
 * Same engine as the WhatsApp bots (ski pass, transfer, equipment, flights, payment links);
 * nothing goes to the customer, you get the link to send.
 */

type Free = { id: string; name: string; max_guests: number; beds: number | null; total: number; per_night: number; isLaCime: boolean; week: string | null; priceSource: string; image: string | null };
type Made = { ok: boolean; reason?: string; message?: string; proposalId?: string; proposalNumber?: string; total?: number; perPerson?: number; apartments?: string; summary?: string };

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const SOURCE: Record<string, string> = { airbnb: "שלנו · מחיר Airbnb נטו", site: "שלנו · מחיר אתר", agency: "סוכנות · שבת-שבת" };
const input = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400";

export default function QuoteBuilderPage() {
  return <AdminGate><QuoteBuilder /></AdminGate>;
}

function QuoteBuilder() {
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(16);
  const [free, setFree] = useState<Free[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [kind, setKind] = useState<"all" | "own" | "agency">("all");
  const [skipass, setSkipass] = useState(true);
  const [threeValleys, setThreeValleys] = useState(false);
  const [equipment, setEquipment] = useState(true);
  const [transfer, setTransfer] = useState(true);
  const [flights, setFlights] = useState(false);
  const [skiDays, setSkiDays] = useState(0); // 0 = nights - 1
  const [outAirport, setOutAirport] = useState("");
  const [retAirport, setRetAirport] = useState("");
  const [airport, setAirport] = useState("");
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState<"he" | "en">("he");
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<Made | null>(null);

  const nights = checkin && checkout ? Math.round((+new Date(checkout) - +new Date(checkin)) / 86400000) : 0;

  const load = async () => {
    setError(""); setMade(null);
    if (!checkin || !checkout || nights <= 0) { setError("בחר תאריך הגעה ועזיבה"); return; }
    setLoading(true);
    try {
      const r = await authFetch("/api/admin/quote-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "options", checkin, checkout }) });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok || !Array.isArray(j.free)) { setError(j?.error || "לא הצלחנו לבדוק זמינות, נסה שוב"); setFree(null); return; }
      setFree(j.free);
      setPicked(p => p.filter(id => j.free.some((f: Free) => f.id === id)));
    } finally { setLoading(false); }
  };

  const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  const chosen = picked.map(id => free?.find(f => f.id === id)).filter(Boolean) as Free[];
  const cap = chosen.reduce((s, f) => s + (f.max_guests || 0), 0);
  const aptTotal = chosen.reduce((s, f) => s + f.total, 0);
  const shown = (free || []).filter(f => kind === "all" || (kind === "agency") === f.isLaCime);

  const create = async () => {
    setError(""); setMade(null);
    if (!chosen.length) { setError("בחר לפחות דירה אחת"); return; }
    if (cap < guests && !confirm(`בדירות שבחרת יש מקום ל-${cap} אנשים, ובקבוצה ${guests}. ליצור הצעה בכל זאת?`)) return;
    setBusy(true);
    try {
      const r = await authFetch("/api/admin/quote-builder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create", checkin, checkout, guests, pick: picked,
          skipass, skiDays, skiArea: threeValleys ? "trois_vallees" : "val_thorens", equipment, transfer, flights,
          airport: flights ? airport : outAirport, returnAirport: transfer ? retAirport : "",
          clientName, contact: phone, lang,
        }),
      });
      const j: Made | null = await r.json().catch(() => null);
      if (!j?.ok || !j.proposalId) { setError(j?.message || j?.reason || "יצירת ההצעה נכשלה"); return; }
      setMade(j);
    } finally { setBusy(false); }
  };

  const link = made?.proposalId ? `https://skisharebook.com/p/${made.proposalId}` : "";
  const waDigits = phone.replace(/\D/g, "").replace(/^0/, "972");
  const waText = lang === "en" ? `Here is your ski holiday quote:\n${link}` : `הנה הצעת המחיר לחופשת הסקי:\n${link}`;

  return (
    <div dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">בונה הצעות לקבוצות</h1>
        <p className="text-gray-500 text-sm mt-1">בוחרים תאריכים, מסמנים את הדירות שרוצים לשלב, ומקבלים הצעה מלאה עם סקי פס, ציוד, הסעה וקישורי תשלום. שום דבר לא נשלח ללקוח, אתה מקבל את הלינק.</p>
      </div>

      {/* 1. dates and group */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <label className="text-sm font-semibold text-gray-700">הגעה<input type="date" className={input} value={checkin} onChange={e => setCheckin(e.target.value)} /></label>
        <label className="text-sm font-semibold text-gray-700">עזיבה<input type="date" className={input} value={checkout} min={checkin || undefined} onChange={e => setCheckout(e.target.value)} /></label>
        <label className="text-sm font-semibold text-gray-700">כמה אנשים<input type="number" min={1} max={40} className={input} value={guests} onChange={e => setGuests(Math.max(1, Math.min(40, Number(e.target.value) || 1)))} /></label>
        <button onClick={load} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl py-2.5 text-sm">
          {loading ? "בודק זמינות…" : free ? "רענן דירות" : "הצג דירות פנויות"}
        </button>
        {nights > 0 && <div className="col-span-2 md:col-span-4 text-xs text-gray-500">{nights} לילות</div>}
      </div>

      {error && <div className="mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</div>}

      {free && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
          {/* 2. apartments */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
              <b className="text-gray-900">{free.length} דירות פנויות</b>
              <div className="flex gap-1.5">
                {([["all", "הכל"], ["own", "שלנו"], ["agency", "סוכנות"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setKind(k)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${kind === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>{l}</button>
                ))}
              </div>
            </div>
            {!shown.length ? <div className="p-10 text-center text-gray-400 text-sm">אין דירות פנויות בתאריכים האלה</div> : (
              <div className="divide-y divide-gray-50">
                {shown.map(f => {
                  const on = picked.includes(f.id);
                  return (
                    <label key={f.id} className={`flex items-center gap-3 px-5 py-3 cursor-pointer ${on ? "bg-blue-50/60" : "hover:bg-gray-50"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggle(f.id)} className="w-5 h-5 accent-blue-600 flex-shrink-0" />
                      {f.image ? <img src={f.image} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" /> : <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm truncate">{f.name}</div>
                        <div className="text-xs text-gray-500">עד {f.max_guests} אנשים{f.beds ? ` · ${f.beds} חדרי שינה` : ""} · {SOURCE[f.priceSource] || f.priceSource}</div>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <div className="font-black text-gray-900">{eur(f.total)}</div>
                        <div className="text-[11px] text-gray-500">{eur(f.per_night)} ללילה</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. the quote */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 lg:sticky lg:top-6">
            <div>
              <b className="text-gray-900">הדירות שנבחרו ({chosen.length})</b>
              {chosen.length ? (
                <ul className="mt-2 text-sm text-gray-700 flex flex-col gap-1">
                  {chosen.map((f, i) => <li key={f.id} className="flex justify-between gap-2"><span className="truncate">{i + 1}. {f.name} ({f.max_guests})</span><span className="font-bold">{eur(f.total)}</span></li>)}
                </ul>
              ) : <p className="text-sm text-gray-400 mt-1">סמן דירות ברשימה</p>}
              {chosen.length > 0 && (
                <div className={`mt-2 text-sm font-bold ${cap >= guests ? "text-emerald-600" : "text-amber-600"}`}>
                  מקום ל-{cap} מתוך {guests} אנשים · לינה {eur(aptTotal)}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm border-t border-gray-100 pt-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={skipass} onChange={e => setSkipass(e.target.checked)} className="accent-blue-600" /> סקי פס</label>
              {skipass && <label className="flex items-center gap-2 mr-6 text-gray-600"><input type="checkbox" checked={threeValleys} onChange={e => setThreeValleys(e.target.checked)} className="accent-blue-600" /> שלושת העמקים</label>}
              {(skipass || equipment) && (
                <label className="flex items-center gap-2 mr-6 text-gray-600">ימי סקי
                  <select className="border border-gray-200 rounded-lg px-2 py-1 text-sm" value={skiDays} onChange={e => setSkiDays(Number(e.target.value))}>
                    <option value={0}>אוטומטי ({Math.max(nights - 1, 0)})</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              )}
              <label className="flex items-center gap-2"><input type="checkbox" checked={equipment} onChange={e => setEquipment(e.target.checked)} className="accent-blue-600" /> ציוד סקי</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={transfer} onChange={e => setTransfer(e.target.checked)} className="accent-blue-600" /> הסעה משדה התעופה</label>
              {transfer && !flights && (
                <div className="mr-6 grid grid-cols-2 gap-2 text-gray-600">
                  <label className="text-xs">הלוך מ-<select className={input} value={outAirport} onChange={e => setOutAirport(e.target.value)}><option value="">ז׳נבה</option><option value="LYS">ליון</option></select></label>
                  <label className="text-xs">חזור ל-<select className={input} value={retAirport} onChange={e => setRetAirport(e.target.value)}><option value="">אותו שדה</option><option value="GVA">ז׳נבה</option><option value="LYS">ליון</option></select></label>
                </div>
              )}
              <label className="flex items-center gap-2"><input type="checkbox" checked={flights} onChange={e => setFlights(e.target.checked)} className="accent-blue-600" /> טיסות ישירות</label>
              {flights && (
                <select className={input} value={airport} onChange={e => setAirport(e.target.value)}>
                  <option value="">השדה הזול (ז׳נבה או ליון)</option><option value="GVA">ז׳נבה</option><option value="LYS">ליון</option>
                </select>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
              <input className={input} placeholder="שם הלקוח" value={clientName} onChange={e => setClientName(e.target.value)} />
              <input className={input} placeholder="טלפון (לא חובה)" dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} />
              <select className={input} value={lang} onChange={e => setLang(e.target.value as "he" | "en")}>
                <option value="he">הצעה בעברית</option><option value="en">הצעה באנגלית</option>
              </select>
            </div>

            <button onClick={create} disabled={busy || !chosen.length} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl py-3">
              {busy ? (flights ? "בונה הצעה ובודק טיסות… (עד 2 דקות)" : "בונה הצעה…") : "צור הצעת מחיר"}
            </button>

            {made?.ok && link && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm flex flex-col gap-2">
                <b className="text-emerald-800">ההצעה מוכנה{made.proposalNumber ? ` · ${made.proposalNumber}` : ""}</b>
                {made.total != null && <div className="text-gray-800">סה״כ {eur(made.total)}{made.perPerson ? ` · ${eur(made.perPerson)} לאדם` : ""}</div>}
                <div className="flex flex-wrap gap-2 mt-1">
                  <a href={link} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 font-bold text-gray-800">פתח</a>
                  <button onClick={() => navigator.clipboard?.writeText(link).catch(() => {})} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 font-bold text-gray-800">העתק לינק</button>
                  {waDigits.length >= 9 && (
                    <a href={`https://wa.me/${waDigits}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 font-bold">שלח בוואטסאפ שלי</a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
