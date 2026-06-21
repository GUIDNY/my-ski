"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import { IconWhatsApp } from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import SkierAvatar from "@/components/SkierAvatar";

type OrderView = {
  code: string; apartment_name: string; area: string;
  checkin: string | null; checkout: string | null; guests: number; nights: number;
  ski_pass: boolean; transfer: boolean; total_eur: number; status: string; customer_name: string;
  apartment?: { images?: string[] } | null;
};
type Saved = {
  id: string; checkin: string | null; checkout: string | null; guests: number;
  apartment: { id: string; name: string; type: string; images: string[]; price_per_night: number; beds: number; baths: number; sqm: number } | null;
};

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s: string | null) => { if (!s) return "—"; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]} ${d.getFullYear()}`; };
const fmtRange = (a: string | null, b: string | null) => { if (!a || !b) return "—"; const x = new Date(a + "T12:00:00"), y = new Date(b + "T12:00:00"); return `${x.getDate()}–${y.getDate()} ${HE[y.getMonth()]} ${y.getFullYear()}`; };
const fmtShort = (s: string | null) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]}`; };
const daysUntil = (s: string | null) => { if (!s) return null; const d = new Date(s + "T12:00:00"); return Math.ceil((d.getTime() - Date.now()) / 86400000); };

const FAQ = [
  { q: "מתי הצ׳ק-אין והצ׳ק-אאוט?", a: "כניסה מ-16:00, יציאה עד 10:00. שעות מדויקות יתואמו עם הנציג לפני ההגעה." },
  { q: "מה כדאי להביא?", a: "ביגוד תרמי, כפפות ומשקפי סקי, קרם הגנה, ודרכון בתוקף לפחות 6 חודשים. ציוד אפשר לשכור באתר." },
  { q: "איך מקבלים את המפתחות?", a: "פרטי הכניסה והמפתחות יישלחו אליך מהנציג ימים ספורים לפני ההגעה." },
  { q: "ביטול", a: "מדיניות הביטולים המלאה מופיעה בתקנון. ניתן לפנות אלינו בכל עת." },
];

const C = { primary: "#0e3566", primaryDim: "#2b4c7e", accent: "#0060ac" };

/* ---- small inline icons ---- */
const Ico = ({ d, fill = false }: { d: string; fill?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{<path d={d} />}</svg>
);
const ICONS = {
  dash: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  cal: "M3 8h18M7 3v4M17 3v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16 8l-2 6-6 2 2-6z",
  group: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M11 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM21 21v-2a4 4 0 0 0-3-3.8M16 3.1a4 4 0 0 1 0 7.7",
  pay: "M3 7h18v10H3zM3 11h18M7 15h2",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  check: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14.1l-3-3",
  add: "M12 5v14M5 12h14",
  home: "M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
};

function SideLink({ icon, label, href, active, onClick }: { icon: string; label: string; href?: string; active?: boolean; onClick?: () => void }) {
  const cls = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-right ${active ? "bg-[#64a8fe] text-[#003c70] font-bold" : "text-[#43474f] hover:bg-[#dce9ff]"}`;
  const inner = <><Ico d={icon} fill={active} /><span className="text-[16px]">{label}</span></>;
  return onClick ? <button onClick={onClick} className={cls}>{inner}</button> : <a href={href} className={cls}>{inner}</a>;
}

function OrderCard({ o, onMore }: { o: OrderView; onMore?: (o: OrderView) => void }) {
  const d = daysUntil(o.checkin);
  const approved = o.status === "approved";
  const img = o.apartment?.images?.[0] ?? "/view.jpg";
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-[#c3c6d0]/40 shadow-[0_4px_20px_rgba(14,53,102,0.05)] group hover:-translate-y-1 transition-all duration-300">
      <div className="flex flex-col sm:flex-row h-full">
        <div className="relative sm:w-2/5 h-44 sm:h-auto">
          <img src={img} alt={o.apartment_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm backdrop-blur"
            style={{ background: "rgba(255,255,255,0.92)", color: approved ? "#0e3566" : "#92400e" }}>
            <Ico d={approved ? ICONS.check : ICONS.cal} /> {approved ? "מאושר" : "ממתין לאישור"}
          </span>
          {d != null && d >= 0 && (
            <span className="absolute bottom-3 right-3 bg-[#0e3566]/90 text-white rounded-xl px-3 py-1.5 text-center backdrop-blur">
              <span className="font-display text-lg font-black leading-none">{d}</span>
              <span className="text-[10px] block opacity-80">{d === 0 ? "היום!" : "ימים"}</span>
            </span>
          )}
        </div>
        <div className="sm:w-3/5 p-5 flex flex-col justify-between text-right">
          <div>
            <h3 className="font-display text-xl font-black" style={{ color: C.primary }}>{o.apartment_name}</h3>
            <p className="text-[#43474f] text-sm mb-4">{o.area}</p>
            <div className="space-y-2">
              <Row icon={ICONS.cal} text={fmtRange(o.checkin, o.checkout)} />
              <Row icon={ICONS.group} text={`${o.guests} אורחים · ${o.nights} לילות`} />
              <Row icon={ICONS.pay} text={`€${Number(o.total_eur).toLocaleString()}`} bold />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100 gap-2">
            <button onClick={() => onMore?.(o)} className="text-sm font-bold px-3 py-1.5 rounded-lg border border-[#c3c6d0]/60 hover:bg-[#eff4ff] transition" style={{ color: C.primary }}>מידע נוסף</button>
            <div className="flex items-center gap-2">
              {approved && <span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><Ico d={ICONS.check} /> שולם</span>}
              <span className="text-xs font-mono text-gray-400">קוד {o.code}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const Row = ({ icon, text, bold }: { icon: string; text: string; bold?: boolean }) => (
  <div className={`flex items-center gap-2 ${bold ? "font-bold" : "text-[#43474f]"}`} style={bold ? { color: C.primary } : {}}>
    <Ico d={icon} /><span className="text-[15px]">{text}</span>
  </div>
);

function OrderModal({ o, onClose }: { o: OrderView; onClose: () => void }) {
  const approved = o.status === "approved";
  const img = o.apartment?.images?.[0] ?? "/view.jpg";
  const addons = [
    { label: "סקי פס", on: o.ski_pass },
    { label: "העברות (טרנספר)", on: o.transfer },
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose} dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative h-44">
          <img src={img} alt={o.apartment_name} className="w-full h-full object-cover rounded-t-3xl" />
          <button onClick={onClose} className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow text-gray-700">✕</button>
          <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm" style={{ background: "rgba(255,255,255,0.92)", color: approved ? "#0e3566" : "#92400e" }}>
            {approved ? "✓ מאושר ושולם" : "ממתין לאישור"}
          </span>
        </div>
        <div className="p-6 text-right">
          <h3 className="font-display text-2xl font-black" style={{ color: C.primary }}>{o.apartment_name}</h3>
          <p className="text-[#43474f] text-sm mb-5">{o.area}</p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <Info label="צ׳ק-אין" value={fmt(o.checkin)} />
            <Info label="צ׳ק-אאוט" value={fmt(o.checkout)} />
            <Info label="אורחים" value={`${o.guests}`} />
            <Info label="לילות" value={`${o.nights}`} />
          </div>

          <p className="font-bold text-sm mb-2" style={{ color: C.primary }}>תוספות בהזמנה</p>
          <div className="space-y-2 mb-5">
            {addons.map(a => (
              <div key={a.label} className="flex items-center justify-between bg-[#f8f9ff] rounded-xl px-4 py-2.5">
                <span className="text-sm text-[#43474f]">{a.label}</span>
                <span className={`text-sm font-bold ${a.on ? "text-emerald-600" : "text-gray-300"}`}>{a.on ? "✓ כלול" : "לא כלול"}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl px-4 py-3.5 text-white" style={{ background: C.primary }}>
            <span className="font-bold">סה״כ ששולם</span>
            <span className="font-display text-2xl font-black">€{Number(o.total_eur).toLocaleString()}</span>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">קוד הזמנה: <span className="font-mono">{o.code}</span></p>
        </div>
      </div>
    </div>
  );
}
const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-[#f8f9ff] rounded-xl px-4 py-3">
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="font-bold text-sm" style={{ color: C.primary }}>{value}</p>
  </div>
);

function SavedCard({ s, onRemove }: { s: Saved; onRemove: (id: string) => void }) {
  const a = s.apartment;
  if (!a) return null;
  const q = s.checkin && s.checkout ? `?checkin=${s.checkin}&checkout=${s.checkout}&guests=${s.guests}` : "";
  return (
    <div className="group bg-white rounded-2xl border border-[#c3c6d0]/40 hover:shadow-lg transition overflow-hidden flex flex-col">
      <div className="relative h-40 overflow-hidden">
        <img src={a.images?.[0] ?? "/view.jpg"} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <button onClick={() => onRemove(s.id)} title="הסר מהשמורים"
          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-red-500 flex items-center justify-center shadow">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#ef4444"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1 text-right">
        <h3 className="font-display font-black" style={{ color: C.primary }}>{a.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{s.checkin && s.checkout ? `${fmtShort(s.checkin)}–${fmtShort(s.checkout)} · ${s.guests} אורחים` : "ללא תאריכים"}</p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="font-display text-lg font-black" style={{ color: C.primary }}>€{a.price_per_night.toLocaleString()}<span className="text-xs font-medium text-gray-400">/לילה</span></span>
          <a href={`/apartments/${a.id}${q}`} className="text-white text-sm font-bold px-4 py-2 rounded-xl transition" style={{ background: C.accent }}>הזמן עכשיו ←</a>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, muted }: { icon?: string; title: string; muted?: boolean }) {
  return (
    <div className="mb-5 border-b border-[#c3c6d0]/40 pb-3">
      <h2 className="font-display text-2xl font-black text-right" style={{ color: muted ? "#43474f" : C.primary }}>{title}</h2>
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
  const [modalOrder, setModalOrder] = useState<OrderView | null>(null);

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
  const name = user ? (user.user_metadata?.full_name || (user.email || "").split("@")[0]) : "";
  const initials = name ? name.trim().slice(0, 2).toUpperCase() : "";

  if (loading) return <Spinner />;

  /* ---------- GUEST (not logged in, no order) ---------- */
  if (!user && !single) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col" dir="rtl">
        <TopBar />
        <div className="flex-1 flex items-center justify-center px-5 py-12">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-4"><SkierAvatar size={84} /></div>
            <h1 className="font-display text-3xl font-black mb-2" style={{ color: C.primary }}>האזור האישי שלי</h1>
            <p className="text-[#43474f] mb-6">התחבר כדי לשמור חופשות ולנהל את ההזמנות שלך — או הזן קוד הזמנה שקיבלת במייל.</p>
            <a href="/auth" className="block w-full text-white font-bold py-3.5 rounded-xl transition mb-4" style={{ background: C.primary }}>התחברות / הרשמה</a>
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="או הזן קוד הזמנה" onKeyDown={e => e.key === "Enter" && lookupSingle(code)}
                className="flex-1 border border-[#c3c6d0] rounded-xl px-4 py-3 text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0060ac]" />
              <button onClick={() => lookupSingle(code)} className="bg-[#0e3566] hover:bg-[#2b4c7e] text-white font-bold px-5 rounded-xl transition">כניסה</button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- SINGLE ORDER (guest with code) ---------- */
  if (!user && single) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]" dir="rtl">
        <TopBar />
        <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
          <div className="bg-white rounded-2xl border border-[#c3c6d0]/40 shadow-sm p-6 flex items-center gap-4">
            <SkierAvatar size={64} />
            <div><p className="text-[#43474f] text-sm">ההזמנה שלך</p><h1 className="font-display text-xl font-black" style={{ color: C.primary }}>{single.apartment_name}</h1></div>
          </div>
          <OrderCard o={single} onMore={setModalOrder} />
          {modalOrder && <OrderModal o={modalOrder} onClose={() => setModalOrder(null)} />}
          <div className="rounded-2xl p-5 text-center" style={{ background: "#e5eeff", border: "1px solid #d3e4fe" }}>
            <p className="text-sm mb-3" style={{ color: C.primary }}>רוצה לשמור את ההזמנה ולגשת אליה תמיד? התחבר/הירשם עם המייל שלך.</p>
            <a href="/auth" className="inline-block text-white font-bold px-6 py-2.5 rounded-xl transition" style={{ background: C.primary }}>התחברות / הרשמה</a>
          </div>
          <FAQBlock open={open} setOpen={setOpen} />
        </main>
      </div>
    );
  }

  /* ---------- LOGGED-IN DASHBOARD ---------- */
  return (
    <div className="min-h-screen bg-[#f8f9ff]" dir="rtl">
      <TopBar onLogout={logout} initials={initials} />

      {/* Desktop sidebar */}
      <aside className="fixed top-0 right-0 h-screen w-64 z-40 bg-white border-l border-[#c3c6d0]/30 shadow-xl hidden md:flex flex-col py-8 px-4 pt-24">
        <div className="mb-8 px-2 text-right">
          <p className="font-bold truncate text-lg" style={{ color: C.primary }}>{name}</p>
          <p className="text-[#43474f] text-xs truncate" dir="ltr">{user!.email}</p>
        </div>
        <nav className="flex-1 space-y-1.5">
          <SideLink icon={ICONS.dash} label="לוח בקרה" active />
          <SideLink icon={ICONS.cal} label="חיפוש דירות" href="/apartments" />
          <SideLink icon={ICONS.group} label="אזור הסיזיונרים" href="/seasonaires" />
          <SideLink icon={ICONS.help} label="עזרה" href={wa} />
        </nav>
        <div className="mt-auto border-t border-[#c3c6d0]/30 pt-3">
          <SideLink icon={ICONS.logout} label="התנתק" onClick={logout} />
        </div>
      </aside>

      <main className="md:mr-64 max-w-5xl mx-auto px-5 py-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="text-right order-1 sm:order-2">
            <p className="text-[#43474f]">שלום, {name} 👋</p>
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight" style={{ color: C.primary }}>האזור האישי שלי</h1>
          </div>
          <div className="flex items-center gap-3 order-2 sm:order-1">
            <a href="/apartments" className="text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition active:scale-95" style={{ background: C.primary }}>
              <Ico d={ICONS.add} /> הזמנה חדשה
            </a>
            <div className="text-center px-4"><div className="font-display text-2xl font-black" style={{ color: C.accent }}>{orders.length}</div><div className="text-xs text-[#43474f]">הזמנות</div></div>
            <div className="text-center px-4 border-r border-[#c3c6d0]/40"><div className="font-display text-2xl font-black" style={{ color: C.accent }}>{saved.length}</div><div className="text-xs text-[#43474f]">שמורות</div></div>
          </div>
        </div>

        {/* Orders */}
        {orders.length > 0 && (
          <section>
            <SectionHead title="ההזמנות שלי" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{orders.map(o => <OrderCard key={o.code} o={o} onMore={setModalOrder} />)}</div>
          </section>
        )}

        {/* Saved */}
        <section>
          <SectionHead title="החופשות השמורות שלי ❤️" muted={saved.length === 0} />
          {saved.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{saved.map(s => <SavedCard key={s.id} s={s} onRemove={removeSaved} />)}</div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-[#c3c6d0]/60 p-10 text-center">
              <div className="text-4xl mb-2">🤍</div>
              <p className="font-semibold" style={{ color: C.primary }}>עוד לא שמרת חופשות</p>
              <p className="text-[#43474f] text-sm mt-1 mb-4">מצאת דירה שאהבת? שמור אותה ותזמין בקליק כשתהיה מוכן.</p>
              <a href="/apartments" className="inline-block text-white font-bold px-6 py-2.5 rounded-xl transition" style={{ background: C.accent }}>גלה דירות ←</a>
            </div>
          )}
        </section>

        {/* Code link — only when the user has no linked order yet */}
        {orders.length === 0 && (
        <section className="bg-white rounded-2xl border border-[#c3c6d0]/40 shadow-sm p-5">
          <p className="font-bold text-sm mb-2" style={{ color: C.primary }}>יש לך קוד הזמנה?</p>
          <div className="flex gap-2">
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="הזן קוד לקישור הזמנה" onKeyDown={e => e.key === "Enter" && claim(code)}
              className="flex-1 border border-[#c3c6d0] rounded-xl px-4 py-2.5 font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#0060ac]" />
            <button onClick={() => claim(code)} className="text-white font-bold px-5 rounded-xl transition" style={{ background: C.accent }}>קשר</button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </section>
        )}

        <FAQBlock open={open} setOpen={setOpen} />
        <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-display font-bold py-3.5 rounded-xl transition"><IconWhatsApp size={20} /> דברו איתנו</a>
      </main>

      {/* Floating help */}
      <a href={wa} target="_blank" rel="noopener noreferrer" className="fixed bottom-24 left-6 md:bottom-8 md:left-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-40 hover:scale-110 active:scale-95 transition-transform text-white" style={{ background: C.accent }}>
        <IconWhatsApp size={26} />
      </a>

      {modalOrder && <OrderModal o={modalOrder} onClose={() => setModalOrder(null)} />}
    </div>
  );
}

function TopBar({ onLogout, initials }: { onLogout?: () => void; initials?: string }) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#c3c6d0]/30">
      <div className="w-full px-4 sm:px-6 h-16 flex items-center gap-2 sm:gap-3">
        <a href="/" className="shrink-0"><img src="/skishare-logo.png" alt="SkiShare" className="h-8" /></a>
        {initials && <div className="w-9 h-9 rounded-full bg-[#d6e3ff] flex items-center justify-center text-sm font-bold shrink-0" style={{ color: C.primary }}>{initials}</div>}
        <div className="flex-1" />
        <a href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition border border-[#c3c6d0]/60 hover:bg-[#eff4ff] shrink-0" style={{ color: C.primary }}>
          <Ico d={ICONS.home} /> <span>דף הבית</span>
        </a>
        {onLogout && (
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition text-red-600 hover:bg-red-50 shrink-0">
            <Ico d={ICONS.logout} /> התנתק
          </button>
        )}
      </div>
    </header>
  );
}

function FAQBlock({ open, setOpen }: { open: number | null; setOpen: (n: number | null) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#c3c6d0]/40 shadow-sm p-6">
      <h2 className="font-display text-lg font-black mb-4" style={{ color: C.primary }}>שאלות ותשובות</h2>
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
  return <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]"><div className="w-10 h-10 border-4 border-[#0060ac] border-t-transparent rounded-full animate-spin" /></div>;
}

export default function MyPage() {
  return <Suspense fallback={<Spinner />}><MyOrder /></Suspense>;
}
