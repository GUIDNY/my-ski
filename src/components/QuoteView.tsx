"use client";
import { useEffect, useState } from "react";
import type { Apartment } from "@/types";
import {
  IconMountain, IconCalendar, IconChevronLeft, IconCheck, IconPlus, IconImage,
  IconTicket, IconSkis, IconBus, IconBank, IconCreditCard,
  IconUsers, IconUser, IconMoon,
} from "@/components/Icons";

export type QuoteData = {
  apartmentId: string;
  apartment: string;
  checkin: string;
  checkout: string;
  guests: number;
  nights: number;
  skiPass: boolean;
  transfer: boolean;
  cancel: string;
  service: string;
  aptTotal: number;
  grandTotal: number;
};

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
};

const TRANSFER_PRICE = 180;
const FLEXIBLE_EXTRA = 100;
const AI_DISCOUNT = 50;

const ADDONS = [
  { icon: <IconTicket size={20} />, title: "סקי פס",            sub: "6 ימים · כל אזור Trois Vallées", price: "€280" },
  { icon: <IconSkis   size={20} />, title: "השכרת ציוד",        sub: "סט מלא · רמת פרימיום",            price: "€150" },
  { icon: <IconBus    size={20} />, title: "הסעות",             sub: "משדה התעופה וחזרה",               price: "€80"  },
  { icon: <IconUser   size={20} />, title: "שיעורי סקי / סנובורד", sub: "מדריך מוסמך · כל הרמות",        soon: true   },
];

export default function QuoteView({ q }: { q: QuoteData }) {
  const {
    apartmentId, apartment, checkin, checkout, guests, nights,
    skiPass, transfer, cancel, service, aptTotal, grandTotal,
  } = q;

  const [apt, setApt] = useState<Apartment | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!apartmentId) return;
    fetch(`/api/apartments/${apartmentId}`).then(r => r.json()).then(setApt).catch(() => {});
  }, [apartmentId]);

  const imgs = apt?.images?.length ? apt.images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];
  const avgNightly = nights > 0 ? Math.round(aptTotal / nights) : aptTotal;

  const bookUrl = `/book?apartment_id=${apartmentId}&apartment=${encodeURIComponent(apartment)}&checkin=${checkin}&checkout=${checkout}&guests=${guests}&ski_pass=${skiPass}&transfer=${transfer}&cancel=${cancel}&service=${service}`;

  const bank = {
    name:    process.env.NEXT_PUBLIC_BANK_NAME    || "בנק הפועלים (12)",
    branch:  "673",
    account: "260269",
    iban:    process.env.NEXT_PUBLIC_BANK_IBAN    || "IL62012673000000026026",
    swift:   process.env.NEXT_PUBLIC_BANK_SWIFT   || "POALILIT",
    holder:  process.env.NEXT_PUBLIC_BANK_ACCOUNT || "SKISHARE - GUINDY IDAN & MIZRAHI AMIT",
  };

  const breakdownRows = (
    <>
      <Row label="לינה" sub={`€${avgNightly.toLocaleString()} × ${nights} לילות`} amount={`€${aptTotal.toLocaleString()}`} />
      {transfer        && <Row label="הסעה הלוך־חזור" sub="שאטל פרטי" amount={`€${TRANSFER_PRICE}`} />}
      {cancel === "flexible" && <Row label="ביטול גמיש" sub={`${guests} אורחים`} amount={`€${(FLEXIBLE_EXTRA * guests).toLocaleString()}`} />}
      {service === "ai" && <Row label="הנחת AI" sub="ניהול עצמאי" amount={`−€${(AI_DISCOUNT * guests).toLocaleString()}`} green />}
      {skiPass && (
        <div className="flex items-center justify-between py-2.5">
          <div><p className="text-sm font-medium text-slate-700">סקי פס</p></div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">בקרוב</span>
        </div>
      )}
    </>
  );

  const addonsGrid = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {ADDONS.map((a, i) => (
        <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">{a.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{a.title}</p>
            <p className="text-xs text-slate-400 truncate">{a.sub}</p>
          </div>
          {"soon" in a && a.soon
            ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex-shrink-0">בקרוב</span>
            : <span className="text-sm font-bold text-blue-600 flex-shrink-0">{(a as { price: string }).price}</span>}
        </div>
      ))}
    </div>
  );

  const paymentBlock = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
        <div className="flex items-center gap-2 text-blue-600 mb-4">
          <IconBank size={18} /><span className="font-bold text-slate-800">העברה בנקאית</span>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-500 border-b border-slate-200 pb-1 mb-2">העברה בשקלים (ILS)</p>
            <KV k="בנק" v={bank.name} />
            <KV k="סניף" v={bank.branch} />
            <KV k="מספר חשבון" v={bank.account} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 border-b border-slate-200 pb-1 mb-2">העברה בינלאומית (FX)</p>
            <KV k="IBAN" v={bank.iban} mono />
            <KV k="SWIFT" v={bank.swift} mono />
            <KV k="מוטב" v={bank.holder} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-blue-600">
            <IconCreditCard size={18} /><span className="font-bold text-slate-800">כרטיס אשראי</span>
          </div>
          <div className="flex gap-1">
            <div className="w-8 h-5 rounded bg-slate-200" />
            <div className="w-8 h-5 rounded bg-slate-200" />
          </div>
        </div>
        <ul className="space-y-2.5">
          <li className="flex items-center gap-2 text-sm text-slate-600"><IconCheck size={14} className="text-emerald-500" /> עד 3 תשלומים ללא ריבית</li>
          <li className="flex items-center gap-2 text-sm text-slate-600"><IconCheck size={14} className="text-emerald-500" /> תשלום מאובטח בתקן PCI-DSS</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f7f9fb] min-h-screen" dir="rtl">

      {/* DESKTOP TOP NAV */}
      <header className="hidden lg:flex sticky top-0 z-50 bg-white border-b border-slate-100 px-8 h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-display font-black text-slate-900 text-lg">
          MySki <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><IconMountain size={16} className="text-white" /></span>
        </a>
        <span className="text-sm font-semibold text-slate-400">הצעת מחיר אישית · {apartment}</span>
      </header>

      {/* MOBILE HEADER */}
      <header className="lg:hidden absolute top-0 inset-x-0 z-30 px-4 py-4 flex items-center justify-between">
        <a href="/" className="font-display font-black text-white text-lg drop-shadow">MySki</a>
        <div className="flex items-center gap-2">
          <a href="#addons" className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold"><IconPlus size={13} /> תוספות</a>
          <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold"><IconImage size={13} /> תמונות</button>
        </div>
      </header>

      {/* MOBILE LAYOUT */}
      <div className="lg:hidden pb-28">
        <section className="relative w-full h-[440px] bg-slate-900 overflow-hidden"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 0 100%)" }}>
          {imgs.map((src, i) => (
            <img key={i} src={src} alt={apartment}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === imgIdx ? "opacity-100" : "opacity-0"}`} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/25" />
          <div className="absolute bottom-16 inset-x-0 px-6 text-white">
            <div className="flex items-center gap-1.5 text-xs font-medium opacity-90 mb-1.5">
              <IconMountain size={13} /> Val Thorens, France
            </div>
            <h1 className="font-display text-5xl font-black leading-none">{apartment}</h1>
            <p className="text-white/60 text-sm mt-2">הצעת מחיר בלעדית</p>
          </div>
        </section>

        <div className="px-4 -mt-4 relative z-20 space-y-5">
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
            <div className="p-5 space-y-4">
              <DetailRow icon={<IconCalendar size={20} />} label="תאריכים"
                main={`${fmtDate(checkin)} — ${fmtDate(checkout)}`} sub={`${nights} לילות`} />
              <div className="h-px bg-slate-100" />
              <DetailRow icon={<IconUsers size={20} />} label="הרכב" main={`${guests} אנשים`} />
            </div>
            <div className="px-5 pt-4 pb-5 bg-slate-50/70 border-t border-slate-100">
              <h3 className="font-display font-bold text-slate-900 mb-3">פירוט מחיר</h3>
              <div className="divide-y divide-slate-100">{breakdownRows}</div>
            </div>
            <div className="bg-slate-900 px-5 py-5 flex items-center justify-between text-white relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
              <div className="relative">
                <p className="text-white/50 text-sm">סה״כ לתשלום</p>
                <p className="text-white/35 text-xs mt-0.5">{guests} אנשים · {nights} לילות</p>
              </div>
              <div className="relative text-left">
                <p className="font-display text-4xl font-black text-emerald-400 leading-none">€{grandTotal.toLocaleString()}</p>
                <p className="text-white/40 text-xs mt-1">~ €{Math.round(grandTotal / nights)} / לילה</p>
              </div>
            </div>
          </div>

          <div id="addons" className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100 p-5 scroll-mt-20">
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2 mb-4"><IconPlus size={18} className="text-blue-600" /> תוספות זמינות</h3>
            {addonsGrid}
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2 px-1"><IconBank size={18} className="text-blue-600" /> דרכי תשלום</h3>
            {paymentBlock}
          </div>

          <p className="flex items-center gap-1.5 justify-center text-xs text-slate-400 pt-2">
            <IconCheck size={13} className="text-emerald-500" /> הצעה תקפה ל־30 יום · MySki · Val Thorens
          </p>
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:block">
        <section className="relative w-full h-[460px] bg-slate-900 overflow-hidden">
          {imgs.map((src, i) => (
            <img key={i} src={src} alt={apartment}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-out ${i === imgIdx ? "opacity-100 scale-105" : "opacity-0 scale-100"}`} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/15 to-slate-900/35" />
          <div className="absolute inset-0 bg-gradient-to-l from-slate-950/60 via-transparent to-slate-950/20" />
          <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 180px rgba(2,6,23,0.55)" }} />

          {imgs.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition">
                <IconChevronLeft size={20} className="rotate-180" />
              </button>
              <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-md text-white flex items-center justify-center transition">
                <IconChevronLeft size={20} />
              </button>
            </>
          )}

          <div className="absolute bottom-10 right-10 left-10 flex items-end justify-between gap-8">
            <div className="text-white text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-widest uppercase mb-4">
                הצעת מחיר בלעדית
              </div>
              <h1 className="font-display text-6xl font-black leading-none drop-shadow-lg">{apartment}</h1>
              <p className="flex items-center gap-1.5 justify-start text-sm text-white/80 mt-3"><IconMountain size={14} /> Val Thorens · Trois Vallées · France</p>
            </div>

            <div className="hidden xl:flex flex-col gap-3 px-6 py-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 text-white text-right min-w-[200px]">
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-white/60">תאריכים</span>
                <span className="font-display font-bold text-sm">{fmtDate(checkin)} — {fmtDate(checkout)}</span>
              </div>
              <div className="h-px bg-white/15" />
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-white/60">סה״כ</span>
                <span className="font-display font-black text-xl text-emerald-300">€{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {imgs.length > 1 && (
            <div className="absolute top-6 left-10 flex gap-2">
              {imgs.slice(0, 6).map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-12 h-12 rounded-lg overflow-hidden ring-2 transition-all hover:scale-105 ${i === imgIdx ? "ring-white scale-105" : "ring-white/25"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {imgs.length > 6 && (
                <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-md ring-2 ring-white/25 flex items-center justify-center text-white text-xs font-bold">
                  +{imgs.length - 6}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-[340px_1fr] gap-8 items-start">
          <aside className="sticky top-24 space-y-4">
            <div className="bg-slate-900 rounded-2xl p-6 text-white text-center relative overflow-hidden">
              <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />
              <p className="relative text-white/50 text-sm mb-1">סה״כ לתשלום</p>
              <p className="relative font-display text-5xl font-black text-emerald-400 leading-none">€{grandTotal.toLocaleString()}</p>
              <p className="relative text-white/40 text-xs mt-2">~ €{Math.round(grandTotal / nights)} / לילה</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="divide-y divide-slate-100">{breakdownRows}</div>
              <a href={bookUrl} className="mt-4 block w-full bg-blue-600 hover:bg-blue-700 text-white font-display font-bold py-3.5 rounded-xl text-center transition shadow-sm shadow-blue-600/20">
                המשך להזמנה ←
              </a>
              <p className="text-center text-xs text-slate-400 mt-3">לחיצה על הכפתור תוביל אותך לעמוד תשלום מאובטח</p>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-5 text-right">פרטי החופשה</h2>
              <div className="grid grid-cols-3 gap-4">
                <StatCard icon={<IconCalendar size={20} />} label="תאריכים" value={`${fmtDate(checkin)} — ${fmtDate(checkout)}`} />
                <StatCard icon={<IconMoon size={20} />} label="משך זמן" value={`${nights} לילות`} />
                <StatCard icon={<IconUsers size={20} />} label="הרכב" value={`${guests} אנשים`} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold text-slate-900">תוספות זמינות</h2>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">אופציונלי</span>
              </div>
              {addonsGrid}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-5">דרכי תשלום</h2>
              {paymentBlock}
            </div>
          </main>
        </div>

        <footer className="bg-slate-100 border-t border-slate-200 py-10 mt-6">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <a href="/" className="font-display font-black text-blue-600 text-xl">MySki</a>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mt-4">
              <a href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'skishareteam@gmail.com'}`} className="hover:text-blue-600">צור קשר</a>
              <span>·</span><span>פרטי בנק</span>
              <span>·</span><span>מדיניות פרטיות</span>
              <span>·</span><span>תנאי שימוש</span>
            </div>
            <p className="text-xs text-slate-400 mt-4">© 2026 MySki Premium Travel · Val Thorens, France</p>
          </div>
        </footer>
      </div>

      {/* MOBILE STICKY CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <p className="text-[11px] text-slate-400 leading-none mb-0.5">סה״כ</p>
            <p className="font-display font-black text-slate-900 text-lg leading-none">€{grandTotal.toLocaleString()}</p>
          </div>
          <a href={bookUrl} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-display font-bold py-3.5 rounded-xl text-center transition shadow-sm shadow-blue-600/20">
            המשך לתשלום ←
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── small components ──────────────────────────────────────── */
function Row({ label, sub, amount, green }: { label: string; sub?: string; amount: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`font-display font-bold tabular-nums ${green ? "text-emerald-600" : "text-slate-900"}`}>{amount}</p>
    </div>
  );
}

function DetailRow({ icon, label, main, sub }: { icon: React.ReactNode; label: string; main: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-right">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="font-display font-bold text-slate-900">{main}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">{icon}</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-right">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">{icon}</span>
      </div>
      <p className="font-display font-bold text-slate-900">{value}</p>
    </div>
  );
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs text-slate-400 flex-shrink-0">{k}</span>
      <span className={`text-sm font-semibold text-slate-800 text-left ${mono ? "font-mono tracking-tight" : ""}`}>{v}</span>
    </div>
  );
}
