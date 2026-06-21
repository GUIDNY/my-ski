"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  { q: "מה כדאי להביא?", a: "ביגוד תרמי, כפפות ומשקפי סקי, קרם הגנה, ודרכון בתוקף לפחות 6 חודשים. ציוד סקי אפשר לשכור באתר." },
  { q: "איך מקבלים את המפתחות?", a: "פרטי הכניסה והמפתחות יישלחו אליך מהנציג ימים ספורים לפני ההגעה." },
  { q: "סקי פס והסעות", a: "אם הוספת סקי פס/הסעה — הם מסודרים מראש. כל שינוי אפשר לתאם איתנו בוואטסאפ." },
  { q: "ביטול", a: "מדיניות הביטולים המלאה מופיעה בתקנון. ניתן לפנות אלינו בכל עת." },
];

function MyOrder() {
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<number | null>(0);

  const lookup = async (c: string) => {
    if (!c) return;
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/orders/code/${encodeURIComponent(c.trim().toLowerCase())}`);
      if (!r.ok) throw new Error();
      setOrder(await r.json());
    } catch { setError("קוד לא נמצא. בדוק שוב או פנה אלינו."); setOrder(null); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const c = params.get("code");
    if (c) { setCode(c); lookup(c); }
  }, [params]);

  const wa = buildWaHref({ intro: "היי! יש לי שאלה על ההזמנה שלי 🎿", lines: order ? [`קוד הזמנה: ${order.code}`] : [] });

  return (
    <div className="min-h-screen bg-[#f7f9fb]" dir="rtl">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900">→ לאתר</a>
          <a href="/"><img src="/skishare-logo.png" alt="SkiShare" className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        {!order ? (
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4"><IconMountain size={30} /></div>
            <h1 className="font-display text-3xl font-black text-gray-900 mb-2">האזור האישי שלי</h1>
            <p className="text-gray-500 mb-6">הזן את קוד ההזמנה שקיבלת במייל האישור כדי לצפות בפרטי החופשה שלך.</p>
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="קוד הזמנה (למשל a7k2qx)"
                onKeyDown={e => e.key === "Enter" && lookup(code)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => lookup(code)} disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold px-6 rounded-xl transition">
                {loading ? "..." : "כניסה"}
              </button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status hero */}
            <div className="rounded-2xl bg-slate-900 text-white p-6 relative overflow-hidden">
              <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl" />
              <p className="relative text-white/60 text-sm">שלום {order.customer_name || "אורח/ת"} 👋</p>
              <h1 className="relative font-display text-3xl font-black mt-1">
                {order.status === "approved" ? "החופשה שלך מאושרת! 🎿" : "ההזמנה שלך התקבלה"}
              </h1>
              {order.status === "approved"
                ? <p className="relative text-emerald-300 font-bold mt-2 flex items-center gap-1.5"><IconCheck size={16} /> התשלום אושר · החופשה מאושרת</p>
                : <p className="relative text-amber-300 text-sm mt-2">ממתין לאישור סופי של נציג</p>}
              {(() => { const d = daysUntil(order.checkin); return d != null && d >= 0 ? (
                <div className="relative mt-5 inline-flex items-baseline gap-2 bg-white/10 rounded-2xl px-5 py-3 backdrop-blur">
                  <span className="font-display text-4xl font-black">{d}</span>
                  <span className="text-white/70 text-sm">{d === 0 ? "החופשה היום!" : "ימים עד החופשה"}</span>
                </div>
              ) : null; })()}
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-display text-lg font-black text-gray-900 mb-4">פרטי ההזמנה</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Detail icon={<IconBed size={16} />} label="דירה" value={`${order.apartment_name}`} />
                <Detail icon={<IconMountain size={16} />} label="אזור" value={order.area} />
                <Detail icon={<IconCalendar size={16} />} label="כניסה" value={fmt(order.checkin)} />
                <Detail icon={<IconCalendar size={16} />} label="יציאה" value={fmt(order.checkout)} />
                <Detail icon={<IconUsers size={16} />} label="אורחים" value={`${order.guests}`} />
                <Detail icon={<IconCheck size={16} />} label="לילות" value={`${order.nights}`} />
              </div>
              {(order.ski_pass || order.transfer) && (
                <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-100">
                  {order.ski_pass && <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">🎿 סקי פס</span>}
                  {order.transfer && <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">🚐 הסעה</span>}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-gray-500 text-sm">סה״כ</span>
                <span className="font-display text-2xl font-black text-gray-900">€{Number(order.total_eur).toLocaleString()}</span>
              </div>
            </div>

            {/* FAQ */}
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

            <a href={wa} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl transition">
              <IconWhatsApp size={20} /> יש לי שאלה — דברו איתנו
            </a>
          </div>
        )}
      </main>
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

export default function MyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <MyOrder />
    </Suspense>
  );
}
