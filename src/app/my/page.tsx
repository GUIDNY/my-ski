"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import { IconMountain, IconCalendar, IconUsers, IconBed, IconCheck, IconWhatsApp } from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import SkierAvatar from "@/components/SkierAvatar";

type OrderView = {
  code: string; apartment_name: string; area: string;
  checkin: string | null; checkout: string | null; guests: number; nights: number;
  ski_pass: boolean; transfer: boolean; total_eur: number; status: string; customer_name: string;
};
type Saved = {
  id: string; checkin: string | null; checkout: string | null; guests: number;
  apartment: { id: string; name: string; type: string; images: string[]; price_per_night: number; beds: number; baths: number; sqm: number } | null;
};

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s: string | null) => { if (!s) return "—"; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]} ${d.getFullYear()}`; };
const fmtShort = (s: string | null) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]}`; };
const daysUntil = (s: string | null) => { if (!s) return null; const d = new Date(s + "T12:00:00"); return Math.ceil((d.getTime() - Date.now()) / 86400000); };

const FAQ = [
  { q: "מתי הצ׳ק-אין והצ׳ק-אאוט?", a: "כניסה מ-16:00, יציאה עד 10:00. שעות מדויקות יתואמו עם הנציג לפני ההגעה." },
  { q: "מה כדאי להביא?", a: "ביגוד תרמי, כפפות ומשקפי סקי, קרם הגנה, ודרכון בתוקף לפחות 6 חודשים. ציוד אפשר לשכור באתר." },
  { q: "איך מקבלים את המפתחות?", a: "פרטי הכניסה והמפתחות יישלחו אליך מהנציג ימים ספורים לפני ההגעה." },
  { q: "ביטול", a: "מדיניות הביטולים המלאה מופיעה בתקנון. ניתן לפנות אלינו בכל עת." },
];

function OrderCard({ o }: { o: OrderView }) {
  const d = daysUntil(o.checkin);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white p-5 relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-black">{o.apartment_name}</p>
            <p className="text-white/60 text-xs mt-0.5">{fmtShort(o.checkin)}–{fmtShort(o.checkout)} · {o.guests} אורחים · {o.nights} לילות</p>
            {o.status === "approved"
              ? <p className="text-emerald-300 font-bold text-sm mt-2 flex items-center gap-1.5"><IconCheck size={14} /> מאושר</p>
              : <p className="text-amber-300 text-xs mt-2">ממתין לאישור</p>}
          </div>
          {d != null && d >= 0 && (
            <div className="text-center bg-white/10 rounded-xl px-3 py-2 backdrop-blur flex-shrink-0">
              <div className="font-display text-2xl font-black leading-none">{d}</div>
              <div className="text-white/60 text-[10px] mt-0.5">{d === 0 ? "היום!" : "ימים"}</div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 flex items-center justify-between">
        <span className="text-xs font-mono text-gray-400">קוד: {o.code}</span>
        <span className="font-display text-lg font-black text-gray-900">€{Number(o.total_eur).toLocaleString()}</span>
      </div>
    </div>
  );
}

function SavedCard({ s, onRemove }: { s: Saved; onRemove: (id: string) => void }) {
  const a = s.apartment;
  if (!a) return null;
  const q = s.checkin && s.checkout ? `?checkin=${s.checkin}&checkout=${s.checkout}&guests=${s.guests}` : "";
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition overflow-hidden flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <img src={a.images?.[0] ?? "/apt1.jpg"} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <button onClick={() => onRemove(s.id)} title="הסר מהשמורים"
          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-red-500 flex items-center justify-center shadow">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#ef4444"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1 text-right">
        <h3 className="font-display font-black text-gray-900">{a.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {s.checkin && s.checkout ? `${fmtShort(s.checkin)}–${fmtShort(s.checkout)} · ${s.guests} אורחים` : "ללא תאריכים"}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="font-display text-lg font-black text-gray-900">€{a.price_per_night.toLocaleString()}<span className="text-xs font-medium text-gray-400">/לילה</span></span>
          <a href={`/apartments/${a.id}${q}`} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition">הזמן עכשיו ←</a>
        </div>
      </div>
    </div>
  );
}

function MyOrder() {
  const params = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [single, setSingle] = useState<OrderView | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

  const loadMine = useCallback(async (u: User) => {
    const [o, s] = await Promise.all([
      fetch(`/api/orders/mine/${u.id}?email=${encodeURIComponent(u.email || "")}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/saved?uid=${u.id}`).then(r => r.ok ? r.json() : []),
    ]);
    setOrders(Array.isArray(o) ? o : []);
    setSaved(Array.isArray(s) ? s : []);
  }, []);

  const lookupSingle = async (c: string) => {
    if (!c) return; setError("");
    const r = await fetch(`/api/orders/code/${encodeURIComponent(c.trim().toLowerCase())}`);
    if (r.ok) setSingle(await r.json()); else setError("קוד לא נמצא. בדוק שוב או פנה אלינו.");
  };

  const claim = async (c: string) => {
    if (!c || !user) return; setError("");
    const r = await fetch("/api/orders/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c.trim().toLowerCase(), user_id: user.id }) });
    const j = await r.json();
    if (!r.ok) { setError(j.error || "שגיאה בקישור"); return; }
    setCode(""); loadMine(user);
  };

  const removeSaved = async (id: string) => {
    await fetch(`/api/saved/${id}`, { method: "DELETE" });
    setSaved(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const urlCode = params.get("code") || "";
      if (session?.user) {
        setUser(session.user);
        if (urlCode) await fetch("/api/orders/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: urlCode.toLowerCase(), user_id: session.user.id }) }).catch(() => {});
        await loadMine(session.user);
      } else if (urlCode) { setCode(urlCode); await lookupSingle(urlCode); }
      setLoading(false);
    });
  }, [params, loadMine]);

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  const wa = buildWaHref({ intro: "היי! יש לי שאלה על ההזמנה שלי 🎿", lines: [] });

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-[#f7f9fb]" dir="rtl">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900">→ לאתר</a>
          <a href="/"><img src="/skishare-logo.png" alt="SkiShare" className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8 space-y-7">
        {user ? (
          <>
            {/* Premium header */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
              <SkierAvatar size={72} />
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-sm">שלום,</p>
                <h1 className="font-display text-2xl font-black text-gray-900 truncate">{user.user_metadata?.full_name || (user.email || "").split("@")[0]}</h1>
                <p className="text-gray-400 text-xs truncate">{user.email}</p>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="flex gap-4">
                  <div><div className="font-display text-xl font-black text-blue-600">{orders.length}</div><div className="text-[11px] text-gray-400">הזמנות</div></div>
                  <div><div className="font-display text-xl font-black text-blue-600">{saved.length}</div><div className="text-[11px] text-gray-400">שמורות</div></div>
                </div>
                <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 mt-3 transition">התנתק</button>
              </div>
            </div>

            {/* Orders */}
            {orders.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-black text-gray-900 mb-3">ההזמנות שלי</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{orders.map(o => <OrderCard key={o.code} o={o} />)}</div>
              </section>
            )}

            {/* Saved trips */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-display text-xl font-black text-gray-900">החופשות השמורות שלי ❤️</h2>
              </div>
              {saved.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{saved.map(s => <SavedCard key={s.id} s={s} onRemove={removeSaved} />)}</div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                  <div className="text-4xl mb-2">🤍</div>
                  <p className="text-gray-600 font-semibold">עוד לא שמרת חופשות</p>
                  <p className="text-gray-400 text-sm mt-1 mb-4">מצאת דירה שאהבת? שמור אותה ותזמין בקליק כשתהיה מוכן.</p>
                  <a href="/apartments" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition">גלה דירות ←</a>
                </div>
              )}
            </section>

            {/* Link by code */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-bold text-gray-800 text-sm mb-2">יש לך קוד הזמנה?</p>
              <div className="flex gap-2">
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="הזן קוד לקישור הזמנה" onKeyDown={e => e.key === "Enter" && claim(code)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => claim(code)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-xl transition">קשר</button>
              </div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </section>

            <FAQBlock open={open} setOpen={setOpen} />
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl transition"><IconWhatsApp size={20} /> דברו איתנו</a>
          </>
        ) : single ? (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
              <SkierAvatar size={64} />
              <div><p className="text-gray-400 text-sm">ההזמנה שלך</p><h1 className="font-display text-xl font-black text-gray-900">{single.apartment_name}</h1></div>
            </div>
            <OrderCard o={single} />
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
              <p className="text-sm text-blue-900 mb-3">רוצה לשמור את ההזמנה ולגשת אליה תמיד? התחבר/הירשם עם המייל שלך.</p>
              <a href="/auth" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition">התחברות / הרשמה</a>
            </div>
            <FAQBlock open={open} setOpen={setOpen} />
          </>
        ) : (
          <div className="max-w-md mx-auto text-center pt-6">
            <div className="flex justify-center mb-4"><SkierAvatar size={84} /></div>
            <h1 className="font-display text-3xl font-black text-gray-900 mb-2">האזור האישי שלי</h1>
            <p className="text-gray-500 mb-6">התחבר כדי לשמור חופשות ולנהל את ההזמנות שלך — או הזן קוד הזמנה שקיבלת במייל.</p>
            <a href="/auth" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition mb-4">התחברות / הרשמה</a>
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="או הזן קוד הזמנה" onKeyDown={e => e.key === "Enter" && lookupSingle(code)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => lookupSingle(code)} className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-5 rounded-xl transition">כניסה</button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

function FAQBlock({ open, setOpen }: { open: number | null; setOpen: (n: number | null) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-display text-lg font-black text-gray-900 mb-4">שאלות ותשובות</h2>
      <div className="divide-y divide-gray-100">
        {FAQ.map((f, i) => (
          <div key={i} className="py-3">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between text-right">
              <span className="font-semibold text-gray-800 text-sm">{f.q}</span>
              <span className="text-gray-400">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
}

export default function MyPage() {
  return <Suspense fallback={<Spinner />}><MyOrder /></Suspense>;
}
