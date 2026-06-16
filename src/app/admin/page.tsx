import { createServerClient } from "@/lib/supabase-server";
import { IconBed, IconSkis, IconCalendar, IconCheck } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const db = createServerClient();

  const [{ count: aptCount }, { count: seasonCount }, { count: bookingCount }, { data: recentBookings }, { data: revenue }] =
    await Promise.all([
      db.from("apartments").select("*", { count: "exact", head: true }),
      db.from("season_rentals").select("*", { count: "exact", head: true }),
      db.from("bookings").select("*", { count: "exact", head: true }),
      db.from("bookings").select("*, apartment:apartments(name)").order("created_at", { ascending: false }).limit(6),
      db.from("bookings").select("total_price").eq("status", "confirmed"),
    ]);

  const totalRevenue = revenue?.reduce((sum, b) => sum + Number(b.total_price), 0) ?? 0;

  const stats = [
    { label: "דירות פעילות",      value: aptCount ?? 0,                       icon: <IconBed size={20} />,      tint: "bg-blue-50 text-blue-600",     href: "/admin/apartments" },
    { label: "דירות סזונרים",     value: seasonCount ?? 0,                    icon: <IconSkis size={20} />,     tint: "bg-cyan-50 text-cyan-600",     href: "/admin/season-rentals" },
    { label: "סה״כ הזמנות",       value: bookingCount ?? 0,                   icon: <IconCalendar size={20} />, tint: "bg-violet-50 text-violet-600", href: "/admin/bookings" },
    { label: "הכנסות מאושרות",    value: `€${totalRevenue.toLocaleString()}`, icon: <span className="font-black text-lg">€</span>, tint: "bg-emerald-50 text-emerald-600", href: "/admin/bookings" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-600",
  };
  const statusLabels: Record<string, string> = { pending: "ממתין", confirmed: "מאושר", cancelled: "בוטל" };

  const quickActions = [
    { label: "דירה חדשה", href: "/admin/apartments", icon: <IconBed size={16} /> },
    { label: "דירת סזונר חדשה", href: "/admin/season-rentals", icon: <IconSkis size={16} /> },
    { label: "כל ההזמנות", href: "/admin/bookings", icon: <IconCalendar size={16} /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">דשבורד</h1>
          <p className="text-gray-500 text-sm mt-1">סקירה כללית של SkiShare · Val Thorens</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickActions.map(a => (
            <a key={a.label} href={a.href}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-700 text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors">
              {a.icon} {a.label}
            </a>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <a key={s.label} href={s.href}
            className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${s.tint} flex items-center justify-center`}>{s.icon}</div>
              <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-lg">←</span>
            </div>
            <div className="text-3xl font-black text-gray-900">{s.value}</div>
            <div className="text-gray-500 text-sm mt-1">{s.label}</div>
          </a>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-black text-gray-900">הזמנות אחרונות</h2>
          <a href="/admin/bookings" className="text-blue-600 text-sm font-semibold hover:underline">הכל →</a>
        </div>
        {!recentBookings?.length ? (
          <div className="py-16 text-center text-gray-400">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-50 text-gray-300 mb-3"><IconCalendar size={24} /></div>
            <div>אין הזמנות עדיין</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentBookings.map((b) => (
              <div key={b.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {b.customer_name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{b.customer_name}</div>
                    <div className="text-xs text-gray-500 truncate">{(b.apartment as { name: string } | null)?.name} · {b.check_in} → {b.check_out}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="font-black text-gray-900">€{Number(b.total_price).toLocaleString()}</div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${statusColors[b.status]}`}>
                    {b.status === "confirmed" && <IconCheck size={11} />}
                    {statusLabels[b.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
