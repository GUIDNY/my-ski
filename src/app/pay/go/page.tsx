import Link from "next/link";
import { wrap, card } from "@/components/ui";
import { readLanding } from "@/lib/pay-landing";
import GoButton from "./GoButton";

/* The page a payment link from the bot opens: what the payment is for, the
   terms checkbox, then on to the secure PayPlus page. */
export default async function PayGo({ searchParams }: { searchParams: Promise<{ d?: string; s?: string }> }) {
  const { d, s } = await searchParams;
  const l = readLanding(d, s);
  const amount = l ? (l.c === "ILS" ? `₪${Math.round(l.a).toLocaleString("en-US")}` : `€${l.a.toLocaleString("en-US", { maximumFractionDigits: 2 })}`) : "";
  return (
    <div className="flex-1 bg-soft" dir="rtl">
      <div className={`${wrap} py-10 md:py-16 flex justify-center`}>
        <div className={`${card} w-full max-w-[520px] p-6 md:p-8 flex flex-col gap-5`}>
          {l ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[14px] text-muted">תשלום ל-SkiShare</span>
                <h1 className="font-display font-extrabold text-[34px] leading-tight text-ink tabular-nums" dir="ltr" style={{ textAlign: "right" }}>{amount}</h1>
                <p className="text-[16px] text-body">{l.t}</p>
              </div>
              <GoButton href={l.u} />
              <p className="text-[13px] text-muted leading-relaxed">
                התשלום מתבצע בדף מאובטח של PayPlus. פרטי הכרטיס מוזנים שם בלבד ולא נשמרים אצלנו. שאלה? <Link href="/contact" className="text-accent font-bold">צרו קשר</Link>.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display font-bold text-[24px] text-ink">הקישור לתשלום לא תקין</h1>
              <p className="text-[16px] text-body">אולי הוא נקטע בהעתקה. כתבו לנו ונשלח קישור חדש.</p>
              <Link href="/contact" className="self-start font-bold text-accent">לצור קשר</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
