"use client";
import SkiLoader from "@/components/SkiLoader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import type { Booking } from "@/types";
import { IconMountain, IconCalendar, IconUser } from "@/components/Icons";
import Logo from "@/components/Logo";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s); return `${d.getDate()} ${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:   { label: "ממתין לאישור", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "מאושר",        color: "bg-green-100 text-green-700" },
  cancelled: { label: "בוטל",         color: "bg-red-100 text-red-600"     },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user,     setUser]     = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);

  const isAdmin = (u: User) =>
    u.user_metadata?.role === "admin" || u.email === "bd12123@gmail.com";

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/auth"); return; }
      setUser(session.user);

      // Fetch bookings matching this user's email
      const res  = await fetch("/api/bookings");
      const all: Booking[] = await res.json();
      const mine = isAdmin(session.user)
        ? all
        : all.filter(b => b.customer_email === session.user.email);
      setBookings(mine);
      setLoading(false);
    });
  }, [router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SkiLoader />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Nav */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center"><Logo className="h-9" /></a>
          <div className="flex-1" />
          {user && isAdmin(user) && (
            <a href="/admin" className="text-sm font-semibold text-purple-600 hover:underline">ניהול</a>
          )}
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors">
            יציאה
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* User card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <IconUser size={24} className="text-blue-600" />
          </div>
          <div>
            <div className="font-black text-gray-900 text-lg">
              {user?.user_metadata?.full_name ?? user?.email}
            </div>
            <div className="text-sm text-gray-400">{user?.email}</div>
            {user && isAdmin(user) && (
              <span className="mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                מנהל
              </span>
            )}
          </div>
        </div>

        {/* Bookings */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900">
            {user && isAdmin(user) ? "כל ההזמנות" : "ההזמנות שלי"}
          </h2>
          <span className="text-sm text-gray-400">{bookings.length} הזמנות</span>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconCalendar size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">אין הזמנות עדיין</p>
            <a href="/" className="mt-3 inline-block text-sm text-blue-600 hover:underline">← חפש חבילת סקי</a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => {
              const nights = b.check_in && b.check_out
                ? Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000) : 0;
              const status = STATUS_MAP[b.status] ?? { label: b.status, color: "bg-gray-100 text-gray-600" };
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-200 transition-colors">
                  <div className="flex items-start gap-0">
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="font-black text-gray-900">{b.apartment?.name ?? "דירה"}</div>
                          <div className="text-sm text-gray-400 mt-0.5">
                            {fmtDate(b.check_in)} — {fmtDate(b.check_out)} · {nights} לילות · {b.guests} אנשים
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-black text-gray-900">€{Number(b.total_price).toLocaleString()}</div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>

                      {/* Add-ons */}
                      {b.add_ons && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {b.add_ons.ski_pass && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                              סקי פס
                            </span>
                          )}
                          {b.add_ons.transfer && (
                            <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">הסעה</span>
                          )}
                          {b.add_ons.insurance && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">ביטוח</span>
                          )}
                          {(b.add_ons as Record<string, unknown>)["cancel_policy"] === "flexible" && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">ביטול גמיש</span>
                          )}
                        </div>
                      )}

                      {/* Customer info for admin */}
                      {user && isAdmin(user) && (
                        <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                          {b.customer_name} · {b.customer_email} {b.customer_phone && `· ${b.customer_phone}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
