import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const db = createServerClient();

  const [{ count: aptCount }, { count: bookingCount }, { data: recentBookings }, { data: revenue }] =
    await Promise.all([
      db.from("apartments").select("*", { count: "exact", head: true }),
      db.from("bookings").select("*", { count: "exact", head: true }),
      db.from("bookings").select("*, apartment:apartments(name)").order("created_at", { ascending: false }).limit(5),
      db.from("bookings").select("total_price").eq("status", "confirmed"),
    ]);

  const totalRevenue = revenue?.reduce((sum, b) => sum + Number(b.total_price), 0) ?? 0;

  const stats = [
    { label: "דירות פעילות", value: aptCount ?? 0, icon: "🏠", color: "bg-blue-50 text-blue-700" },
    { label: "סה״כ הזמנות", value: bookingCount ?? 0, icon: "📋", color: "bg-green-50 text-green-700" },
    { label: "הכנסות מאושרות", value: `€${totalRevenue.toLocaleString()}`, icon: "💰", color: "bg-purple-50 text-purple-700" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const statusLabels: Record<string, string> = {
    pending: "ממתין",
    confirmed: "מאושר",
    cancelled: "בוטל",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">דשבורד</h1>
        <p className="text-gray-500 text-sm mt-1">סקירה כללית של SkiShare</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-xl mb-3`}>
              {s.icon}
            </div>
            <div className="text-2xl font-black text-gray-900">{s.value}</div>
            <div className="text-gray-500 text-sm mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">הזמנות אחרונות</h2>
          <a href="/admin/bookings" className="text-blue-600 text-sm hover:underline">הכל →</a>
        </div>
        {!recentBookings?.length ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <div>אין הזמנות עדיין</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentBookings.map((b) => (
              <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{b.customer_name}</div>
                  <div className="text-sm text-gray-500">{(b.apartment as { name: string } | null)?.name} · {b.check_in} → {b.check_out}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-bold text-gray-900">€{Number(b.total_price).toLocaleString()}</div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[b.status]}`}>
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
