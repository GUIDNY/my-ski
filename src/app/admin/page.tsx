import { createServerClient } from "@/lib/supabase-server";
import { IconCalendar, IconCheck, IconBus } from "@/components/Icons";

export const dynamic = "force-dynamic";

const fmt = (s: string | null) => (s ? new Date(s + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "short" }) : "—");
const daysUntil = (s: string | null) => { if (!s) return null; return Math.ceil((new Date(s + "T12:00:00").getTime() - Date.now()) / 86400000); };

type Ord = {
  id: string; code: string; customer_name: string | null; customer_email: string | null;
  apartment_name: string | null; checkin: string | null; checkout: string | null;
  guests: number; nights: number; total_eur: number; status: string;
  transfer: boolean; payplus_transaction_uid: string | null; ops: Record<string, boolean> | null;
};

export default async function AdminDashboard() {
  const db = createServerClient();
  const [{ count: aptCount }, { count: seasonCount }, { data: ordersRaw }] = await Promise.all([
    db.from("apartments").select("*", { count: "exact", head: true }),
    db.from("season_rentals").select("*", { count: "exact", head: true }),
    db.from("orders").select("id, code, customer_name, customer_email, apartment_name, checkin, checkout, guests, nights, total_eur, status, transfer, payplus_transaction_uid, ops").order("created_at", { ascending: false }),
  ]);
  const orders = (ordersRaw ?? []) as Ord[];

  const holds = orders.filter(o => o.status === "hold");
  const leads = orders.filter(o => o.status === "awaiting");
  const approved = orders.filter(o => o.status === "approved");
  const transfersToDo = orders.filter(o => o.transfer && (o.status === "hold" || o.status === "approved") && !(o.ops && o.ops.transfer));
  const revenue = approved.reduce((s, o) => s + Number(o.total_eur || 0), 0);
  const upcoming = approved.filter(o => (daysUntil(o.checkin) ?? -1) >= 0).sort((a, b) => (daysUntil(a.checkin)! - daysUntil(b.checkin)!)).slice(0, 5);

  const stats = [
    { label: "פיקדונות לאישור", value: holds.length, tint: "bg-amber-50 text-amber-600", href: "/admin/orders" },
    { label: "הכנסות מאושרות", value: `€${revenue.toLocaleString()}`, tint: "bg-emerald-50 text-emerald-600", href: "/admin/orders" },
    { label: "דירות פעילות", value: aptCount ?? 0, tint: "bg-blue-50 text-blue-600", href: "/admin/apartments" },
    { label: "דירות סיזיונרים", value: seasonCount ?? 0, tint: "bg-cyan-50 text-cyan-600", href: "/admin/season-rentals" },
  ];

  const actions = [
    { n: holds.length, label: "פיקדונות ממתינים לאישור וחיוב", sub: "לחץ לאשר ולחייב את הלקוח", color: "amber", href: "/admin/orders" },
    { n: transfersToDo.length, label: "הסעות לתאם", sub: "לקוחות שהזמינו שאטל וטרם סומן כבוצע", color: "blue", href: "/admin/orders" },
    { n: leads.length, label: "לידים חמים — הגיעו לתשלום ולא שילמו", sub: "שווה להתקשר ולסגור", color: "orange", href: "/admin/orders" },
  ].filter(a => a.n > 0);

  const COLOR: Record<string, string> = { amber: "border-amber-200 bg-amber-50", blue: "border-blue-200 bg-blue-50", orange: "border-orange-200 bg-orange-50" };
  const BADGE: Record<string, string> = { amber: "bg-amber-500", blue: "bg-blue-600", orange: "bg-orange-500" };
  const STATUS: Record<string, { label: string; cls: string }> = {
    awaiting: { label: "🔥 ליד חם", cls: "bg-orange-100 text-orange-700" },
    hold: { label: "פיקדון — לאישור", cls: "bg-amber-100 text-amber-700" },
    approved: { label: "אושר ✓", cls: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: "בוטל", cls: "bg-red-100 text-red-600" },
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">דשבורד</h1>
          <p className="text-gray-500 text-sm mt-1">סקירה כללית · SkiShare · Val Thorens</p>
        </div>
        <a href="/admin/orders" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">הזמנות ותשלומים →</a>
      </div>

      {/* Requires action */}
      <div className="mb-8">
        <h2 className="font-black text-gray-900 mb-3">⚡ דורש פעולה</h2>
        {actions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-500 flex items-center justify-center gap-2">
            <IconCheck size={18} className="text-emerald-500" /> הכל מטופל — אין משימות פתוחות 🎉
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actions.map((a, i) => (
              <a key={i} href={a.href} className={`rounded-2xl border ${COLOR[a.color]} p-5 hover:shadow-md transition-all`}>
                <div className="flex items-center gap-3">
                  <span className={`w-11 h-11 rounded-xl ${BADGE[a.color]} text-white flex items-center justify-center font-black text-lg flex-shrink-0`}>{a.n}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm leading-tight">{a.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{a.sub}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <a key={s.label} href={s.href} className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
            <div className={`w-11 h-11 rounded-xl ${s.tint} flex items-center justify-center mb-4`}><IconCalendar size={20} /></div>
            <div className="text-3xl font-black text-gray-900">{s.value}</div>
            <div className="text-gray-500 text-sm mt-1">{s.label}</div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-black text-gray-900">הזמנות אחרונות</h2>
            <a href="/admin/orders" className="text-blue-600 text-sm font-semibold hover:underline">הכל →</a>
          </div>
          {!orders.length ? (
            <div className="py-16 text-center text-gray-400">אין הזמנות עדיין</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.slice(0, 6).map(o => {
                const st = STATUS[o.status] || STATUS.awaiting;
                return (
                  <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{o.customer_name || "לקוח/ה"}</div>
                      <div className="text-xs text-gray-500 truncate">{o.apartment_name} · {fmt(o.checkin)}–{fmt(o.checkout)}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-black text-gray-900">€{Number(o.total_eur).toLocaleString()}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming arrivals */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-black text-gray-900">הגעות קרובות</h2></div>
          {!upcoming.length ? (
            <div className="py-16 text-center text-gray-400">אין הגעות מאושרות קרובות</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcoming.map(o => {
                const d = daysUntil(o.checkin)!;
                return (
                  <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{o.apartment_name}</div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                        {o.customer_name} · {fmt(o.checkin)} {o.transfer && <span className="text-blue-600 flex items-center gap-0.5"><IconBus size={11} /> הסעה</span>}
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex-shrink-0">{d === 0 ? "היום" : `בעוד ${d} ימים`}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
