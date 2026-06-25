"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CardPaymentButton from "@/components/CardPaymentButton";
import { IconMountain, IconWhatsApp, IconCheck } from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import Logo from "@/components/Logo";

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s?: string) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ${HE[d.getMonth()]} ${d.getFullYear()}`; };
const TRANSFER_PRICE = 180;

type GroupData = {
  group: { id: string; code: string; apartment_id: string; extra_apartment_id: string | null; apartment_name: string; area: string; checkin: string; checkout: string; guests: number; accommodation_total: number; shares_total: number };
  share_price: number; shares_total: number; shares_paid: number; accommodation_paid: number;
  payers: { name: string; ski_pass: boolean; transfer: boolean }[];
};

export default function SplitPage() {
  const { code } = useParams<{ code: string }>();
  const [d, setD] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => fetch(`/api/groups?code=${code}`).then(r => r.ok ? r.json() : null).then(setD).finally(() => setLoading(false));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [code]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!d) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] text-gray-500" dir="rtl">הקבוצה לא נמצאה.</div>;

  const { group } = d;
  const nights = group.checkin && group.checkout ? Math.round((+new Date(group.checkout) - +new Date(group.checkin)) / 86400000) : 0;
  const pct = Math.min(100, Math.round((d.shares_paid / d.shares_total) * 100));
  const remaining = Math.max(0, d.shares_total - d.shares_paid);
  const myShare = d.share_price;
  const full = remaining <= 0;

  const wa = buildWaHref({ intro: `היי! לגבי תשלום מפוצל לדירה ${group.apartment_name} 🎿`, lines: [`קוד קבוצה: ${group.code}`] });

  return (
    <div className="min-h-screen bg-[#f8f9ff]" dir="rtl">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900">→ לאתר</a>
          <a href="/"><Logo className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-6">
        <div className="text-center">
          <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">תשלום מפוצל בין חברים</span>
          <h1 className="font-display text-3xl font-black text-gray-900">{group.apartment_name}</h1>
          <p className="text-gray-500 mt-1 flex items-center justify-center gap-1"><IconMountain size={14} className="text-blue-400" /> {group.area} · {fmt(group.checkin)}–{fmt(group.checkout)} · {nights} לילות</p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-900">{d.shares_paid} מתוך {d.shares_total} שילמו</span>
            <span className="text-sm font-bold text-blue-600">{pct}% מהדירה שולם</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {d.payers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {d.payers.map((pp, i) => (
                <span key={i} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
                  <IconCheck size={11} /> {pp.name || "אורח"}{pp.transfer ? " · הסעה" : ""}
                </span>
              ))}
              {Array.from({ length: remaining }).map((_, i) => (
                <span key={`r${i}`} className="text-xs bg-gray-50 text-gray-400 px-2.5 py-1 rounded-full font-semibold">ממתין לתשלום</span>
              ))}
            </div>
          )}
        </div>

        {/* Pay your share */}
        {full ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-black text-emerald-800 text-lg">כל המשלמים שילמו — ההזמנה הושלמה!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-display text-lg font-black text-gray-900">החלק שלך</h2>
            <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
              <div><span className="font-bold text-blue-900">לתשלום עכשיו</span><span className="block text-xs text-blue-600">חלק שווה מהסה״כ (כולל כל התוספות) ÷ {d.shares_total}</span></div>
              <span className="font-display text-2xl font-black text-blue-700">€{myShare.toLocaleString()}</span>
            </div>
            <CardPaymentButton
              apartmentId={group.apartment_id} apartment={group.apartment_name}
              extraApartmentId={group.extra_apartment_id ?? undefined}
              checkin={group.checkin} checkout={group.checkout} guests={group.guests} nights={nights}
              cancel="regular" service="human" grandTotal={myShare}
              split={{ sharesTotal: d.shares_total, accommodationTotal: group.accommodation_total, shareAmount: d.share_price, groupId: group.id }}
              label="שלם/י את חלקך בכרטיס" />
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full text-sm text-[#1ebe5a] font-bold hover:underline pt-1">
              <IconWhatsApp size={16} /> שאלה? דברו עם נציג
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
