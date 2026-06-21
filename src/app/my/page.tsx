"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import { IconMountain, IconCalendar, IconUsers, IconBed, IconCheck, IconWhatsApp } from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";

type OrderView = {
  code: string; apartment_name: string; area: string;
  checkin: string | null; checkout: string | null; guests: number; nights: number;
  ski_pass: boolean; transfer: boolean; total_eur: number; status: string; customer_name: string;
};

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s: string | null) => { if (!s) return "—"; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]} ${d.getFullYear()}`; };
const daysUntil = (s: string | null) => { if (!s) return null; const d = new Date(s + "T12:00:00"); return Math.ceil((d.getTime() - Date.now()) / 86400000); };

const FAQ = [
  { q: "מתי הצ׳ק-אין והצ׳ק-אאוט?", a: "כניסה מ-16:00, יציאה עד 10:00. שעות מדויקות יתואמו עם הנציג לפני ההגעה." },
  { q: "מה כדאי להביא?", a: "ביגוד תרמי, כפפות ומשקפי סקי, קרם הגנה, ודרכון בתוקף לפחות 6 חודשים. ציוד אפשר לשכור באתר." },
  { q: "איך מקבלים את המפתחות?", a: "פרטי הכניסה והמפתחות יישלחו אליך מהנציג ימים ספורים לפני ההגעה." },
  { q: "סקי פס והסעות", a: "אם הוספת סקי פס/הסעה — הם מסודרים מראש. כל שינוי אפשר לתאם בוואטסאפ." },
  { q: "ביטול", a: "מדיניות הביטולים המלאה מופיעה בתקנון. ניתן לפנות אלינו בכל עת." },
];

function OrderCard({ o }: { o: OrderView }) {
  const d = daysUntil(o.checkin);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-900 text-white p-6 relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl" />
        <h2 className="relative font-display text-2xl font-black">
          {o.status === "approved" ? "החופשה מאושרת! 🎿" : "ההזמנה התקבלה"}
        </h2>
        {o.status === "approved"
          ? <p className="relative text-emerald-300 font-bold mt-1 flex items-center gap-1.5 text-sm"><IconCheck size={15} /> התשלום אושר · החופשה מאושרת</p>
          : <p className="relative text-amber-300 text-sm mt-1">ממתין לאישור סופי של נציג</p>}
        <p className="relative text-white/40 text-xs mt-1 font-mono">קוד: {o.code}</p>
        {d != null && d >= 0 && (
          <div className="relative mt-4 inline-flex items-baseline gap-2 bg-white/10 rounded-2xl px-5 py-3 backdrop-blur">
            <span className="font-display text-4xl font-black">{d}</span>
            <span className="text-white/70 text-sm">{d === 0 ? "החופשה היום!" : "ימים עד החופשה"}</span>
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Detail icon={<IconBed size={16} />} label="דירה" value={o.apartment_name} />
          <Detail icon={<IconMountain size={16} />} label="אזור" value={o.area} />
          <Detail icon={<IconCalendar size={16} />} label="כניסה" value={fmt(o.checkin)} />
          <Detail icon={<IconCalendar size={16} />} label="יציאה" value={fmt(o.checkout)} />
          <Detail icon={<IconUsers size={16} />} label="אורחים" value={`${o.guests}`} />
          <Detail icon={<IconCheck size={16} />} label="לילות" value={`${o.nights}`} />
        </div>
        {(o.ski_pass || o.transfer) && (
          <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-100">
            {o.ski_pass && <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">🎿 סקי פס</span>}
            {o.transfer && <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">🚐 הסעה</span>}
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-gray-500 text-sm">סה״כ</span>
          <span className="font-display text-2xl font-black text-gray-900">€{Number(o.total_eur).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function MyOrder() {
  const params = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderView[] | null>(null); // logged-in list
  const [single, setSingle] = useState<OrderView | null>(null);   // guest single
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(0);

  const loadMine = useCallback(async (u: User) => {
    const r = await fetch(`/api/orders/mine/${u.id}?email=${encodeURIComponent(u.email || "")}`);
    setOrders(r.ok ? await r.json() : []);
  }, []);

  const lookupSingle = async (c: string) => {
    if (!c) return;
    setError("");
    const r = await fetch(`/api/orders/code/${encodeURIComponent(c.trim().toLowerCase())}`);
    if (r.ok) setSingle(await r.json());
    else setError("קוד לא נמצא. בדוק שוב או פנה אלינו.");
  };

  const claim = async (c: string) => {
    if (!c || !user) return;
    setError("");
    const r = await fetch("/api/orders/claim", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: c.trim().toLowerCase(), user_id: user.id }),
    });
    const j = await r.json();
    if (!r.ok) { setError(j.error || "שגיאה בקישור"); return; }
    setCode(""); loadMine(user);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const urlCode = params.get("code") || "";
      if (session?.user) {
        setUser(session.user);
        if (urlCode) {
          await fetch("/api/orders/claim", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: urlCode.toLowerCase(), user_id: session.user.id }),
          }).catch(() => {});
        }
        await loadMine(session.user);
      } else if (urlCode) {
        setCode(urlCode);
        await lookupSingle(urlCode);
      }
      setLoading(false);
    });
  }, [params, loadMine]);

  const wa = buildWaHref({ intro: "היי! יש לי שאלה על ההזמנה שלי 🎿", lines: [] });

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-[#f7f9fb]" dir="rtl">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900">→ לאתר</a>
          <a href="/"><img src="/skishare-logo.png" alt="SkiShare" className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-6">
        {/* ── Logged-in ── */}
        {user ? (
          <>
            <div>
              <h1 className="font-display text-3xl font-black text-gray-900">האזור האישי שלי</h1>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
            </div>

            {orders && orders.length > 0
              ? orders.map(o => <OrderCard key={o.code} o={o} />)
              : <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-500">עדיין אין הזמנות מקושרות. הזן קוד הזמנה שקיבלת במייל כדי לקשר.</div>}

            {/* add code */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="font-bold text-gray-800 text-sm mb-2">קישור הזמנה עם קוד</p>
              <div className="flex gap-2">
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="קוד הזמנה"
                  onKeyDown={e => e.key === "Enter" && claim(code)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => claim(code)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-xl transition">קשר</button>
              </div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>

            <FAQBlock open={open} setOpen={setOpen} />
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl transition"><IconWhatsApp size={20} /> דברו איתנו</a>
          </>
        ) : single ? (
          /* ── Guest, viewing a single order by code ── */
          <>
            <OrderCard o={single} />
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
              <p className="text-sm text-blue-900 mb-3">רוצה לשמור את ההזמנה ולגשת אליה תמיד? התחבר/הירשם עם המייל שלך.</p>
              <a href="/auth" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl transition">התחברות / הרשמה</a>
            </div>
            <FAQBlock open={open} setOpen={setOpen} />
          </>
        ) : (
          /* ── Guest, no code yet ── */
          <div className="max-w-md mx-auto text-center pt-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4"><IconMountain size={30} /></div>
            <h1 className="font-display text-3xl font-black text-gray-900 mb-2">האזור האישי שלי</h1>
            <p className="text-gray-500 mb-6">הזן את קוד ההזמנה שקיבלת במייל, או התחבר עם המייל כדי לראות את כל ההזמנות שלך.</p>
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="קוד הזמנה" onKeyDown={e => e.key === "Enter" && lookupSingle(code)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => lookupSingle(code)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl transition">כניסה</button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            <a href="/auth" className="inline-block text-blue-600 font-semibold text-sm mt-5">או התחבר עם המייל ←</a>
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

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-blue-500 mt-0.5">{icon}</span>
      <div><p className="text-xs text-gray-400">{label}</p><p className="font-semibold text-gray-900">{value}</p></div>
    </div>
  );
}

function Spinner() {
  return <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
}

export default function MyPage() {
  return <Suspense fallback={<Spinner />}><MyOrder /></Suspense>;
}
