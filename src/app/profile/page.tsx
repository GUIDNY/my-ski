"use client";
import SkiLoader from "@/components/SkiLoader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import type { Booking } from "@/types";
import { authFetch } from "@/lib/auth-fetch";
import { PageTop, SectionHead, EmptyState, btn, card, wrap, h3 } from "@/components/ui";

const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmtDate = (s: string) => { if (!s) return ""; const d = new Date(s); return `${d.getDate()} ב${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: "ממתין לאישור", cls: "bg-warn-soft text-warn" },
  confirmed: { label: "מאושר",        cls: "bg-ok-soft text-ok-text" },
  cancelled: { label: "בוטל",          cls: "bg-danger-soft text-danger" },
};

const addonChip = "inline-flex items-center rounded-full bg-soft border border-line px-3 py-1 text-[13px] font-medium text-ink";

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
      const res  = await authFetch("/api/bookings");
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

  if (loading) return <SkiLoader />;

  const admin = !!user && isAdmin(user);
  const name = user?.user_metadata?.full_name ?? user?.email ?? "";

  return (
    <div className="flex-1 bg-white" dir="rtl">
      <PageTop soft
        crumbs={[{ label: "דף הבית", href: "/" }, { label: "האזור שלי", href: "/my" }, { label: "הפרופיל" }]}
        title={name}
        sub={<span dir="ltr">{user?.email}</span>}
        aside={<>
          {admin && <span className="inline-flex items-center min-h-[44px] px-4 rounded-full bg-accent-soft text-accent text-[14px] font-bold">מנהל</span>}
          {admin && <Link href="/admin" className={btn.pill}>ניהול</Link>}
          <button type="button" onClick={logout} className={btn.pill}>יציאה</button>
        </>} />

      <div className={`${wrap} py-8 md:py-10`}>
        <SectionHead title={admin ? "כל ההזמנות" : "ההזמנות שלי"}
          action={<span className="text-[15px] text-muted">{bookings.length} הזמנות</span>} />

        {bookings.length === 0 ? (
          <EmptyState title="אין הזמנות עדיין" text="כשתזמינו חופשה היא תופיע כאן."
            action={<Link href="/search?deal=full" className={btn.primary}>לחיפוש חבילת סקי</Link>} />
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map(b => {
              const nights = b.check_in && b.check_out
                ? Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000) : 0;
              const status = STATUS_MAP[b.status] ?? { label: b.status, cls: "bg-soft text-muted" };
              return (
                <article key={b.id} className={`${card} p-5 md:p-6`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <h3 className={h3}>{b.apartment?.name ?? "דירה"}</h3>
                      <div className="text-[15px] text-muted mt-1">
                        {fmtDate(b.check_in)} עד {fmtDate(b.check_out)} · {nights} לילות · {b.guests} אנשים
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-1.5">
                      <div className="font-display font-extrabold text-[24px] leading-none text-ink">€{Number(b.total_price).toLocaleString("en-US")}</div>
                      <span className={`text-[13px] font-bold px-3 py-1 rounded-full ${status.cls}`}>{status.label}</span>
                    </div>
                  </div>

                  {/* Add-ons */}
                  {b.add_ons && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {b.add_ons.ski_pass && <span className={addonChip}>סקי פס</span>}
                      {b.add_ons.transfer && <span className={addonChip}>הסעה</span>}
                      {b.add_ons.insurance && <span className={addonChip}>ביטוח</span>}
                      {(b.add_ons as Record<string, unknown>)["cancel_policy"] === "flexible" && <span className={addonChip}>ביטול גמיש</span>}
                    </div>
                  )}

                  {/* Customer info for admin */}
                  {admin && (
                    <div className="mt-4 pt-4 border-t border-line text-[14px] text-muted">
                      {b.customer_name} · <span dir="ltr">{b.customer_email}</span> {b.customer_phone && <>· <span dir="ltr">{b.customer_phone}</span></>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
