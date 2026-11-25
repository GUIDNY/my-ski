"use client";
import { useState } from "react";
import CardPaymentButton from "@/components/CardPaymentButton";
import { wrap, card, h2, btn, field, fieldLabel } from "@/components/ui";
import { equipCost } from "@/lib/pricing";
import { GEAR_SHOP, HELMET_PRICE, gearDays, personCost, type GearKind, type GearPerson } from "@/lib/gear";

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => new Date(Date.parse(iso + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const nextDay = (iso: string) => new Date(Date.parse(iso + "T12:00:00Z") + 864e5).toISOString().slice(0, 10);
const blank = (kind: GearKind = "ski"): GearPerson => ({ name: "", kind, helmet: false });

/*
 * Rent skis or a snowboard from us, for anyone in Val Thorens: the dates, one
 * row per person (name in English, as the shop sees it), then pay
 * by card now or order now and pay later. The gear waits at Caron Skishop.
 */
export default function EquipmentClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [people, setPeople] = useState<GearPerson[]>([blank()]);
  const [later, setLater] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ code: string; total: number; emailed: boolean } | null>(null);

  const days = gearDays(from, to);
  const ready = people.filter(p => p.name.trim());
  const perPerson = days > 0 ? equipCost(days) : 0;
  const total = days > 0 ? ready.reduce((t, p) => t + personCost(days, p), 0) : 0;
  const gear = { from, to, people: ready };
  const missing = [
    days < 1 && "תאריכים",
    !ready.length && "שם של לפחות אדם אחד (באנגלית)",
  ].filter(Boolean) as string[];

  // any language goes; English is only a recommendation (the shop reads the email)
  const latin = (n: string) => /^[A-Za-z][A-Za-z .'-]*$/.test(n.trim());
  const nextStep = days < 1 ? { label: "בחרו תאריכי גלישה", go: "gear-dates" } : !ready.length ? { label: "כתבו את שם הגולש", go: "gear-people" } : null;
  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });

  const set = (i: number, k: keyof GearPerson, v: string | boolean) =>
    setPeople(ps => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  const orderLater = async () => {
    setErr("");
    if (missing.length) { setErr(`חסר: ${missing.join(", ")}`); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/gear", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gear, ...contact }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "משהו השתבש, נסו שוב"); setBusy(false); return; }
      setDone(j);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { setErr("משהו השתבש, נסו שוב או כתבו לנו בוואטסאפ"); }
    setBusy(false);
  };

  if (done) return (
    <div className={`${wrap} py-12 md:py-20 flex justify-center`}>
      <div className={`${card} w-full max-w-[560px] p-7 md:p-9 text-center flex flex-col items-center gap-3`} role="status">
        <span className="text-[44px]" aria-hidden="true">🏂</span>
        <h1 className="font-display font-bold text-[28px] text-ink">סגרנו! הציוד מחכה לכם</h1>
        <p className="text-[16px] text-body">קוד הזמנה <b className="font-mono tracking-widest">{done.code.toUpperCase()}</b> · {eur(done.total)}</p>
        <p className="text-[16px] text-body leading-relaxed">
          {done.emailed ? "שלחנו לכם מייל באנגלית עם כל הפרטים." : "נשלח לכם מייל עם הפרטים בהקדם."} מגיעים ל-<b>{GEAR_SHOP.name}</b> בואל טורנס, מראים את המייל, ויוצאים לגלוש. את התשלום נסגור איתכם בוואטסאפ.
        </p>
        <a href={GEAR_SHOP.maps} target="_blank" rel="noopener noreferrer" className={`${btn.outline} mt-2`}>איפה החנות? (מפה)</a>
      </div>
    </div>
  );

  return (
    <div className={`${wrap} pb-16 md:pb-24 grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-10 items-start`}>
      <div className="flex flex-col gap-8">
        {/* dates */}
        <section id="gear-dates" className="flex flex-col gap-3">
          <h2 className={h2}>מתי אתם על ההר?</h2>
          <div className="grid grid-cols-2 gap-3 max-w-[520px]">
            <label><span className={fieldLabel}>יום ראשון של גלישה</span>
              <input type="date" className={field} min={today()} value={from} onChange={e => { setFrom(e.target.value); if (to && e.target.value > to) setTo(""); }} />
            </label>
            <label><span className={fieldLabel}>יום אחרון של גלישה</span>
              <input type="date" className={field} min={from || today()} value={to} onChange={e => setTo(e.target.value)} />
            </label>
          </div>
          {from && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] text-muted">כמה ימים?</span>
              {[1, 3, 5, 6, 7].map(n => (
                <button key={n} type="button" onClick={() => setTo(addDays(from, n - 1))} aria-pressed={days === n}
                  className={`min-h-[40px] px-3.5 rounded-full border text-[14px] font-bold transition-colors ${days === n ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-body hover:border-ink"}`}>
                  {n === 1 ? "יום אחד" : `${n} ימים`}
                </button>
              ))}
            </div>
          )}
          {days > 0 && <p className="text-[15px] text-ink"><b>{days} ימי גלישה</b> · {eur(perPerson)} לגולש, כולל נעליים</p>}
        </section>

        {/* people */}
        <section id="gear-people" className="flex flex-col gap-3">
          <h2 className={h2}>מי גולש?</h2>
          <p className="text-[15px] text-muted -mt-1">שם באנגלית, כמו שיופיע בחנות. את המידות מתאימים במקום.</p>
          <div className="flex flex-col gap-3">
            {people.map((p, i) => (
              <div key={i} className={`${card} p-4 md:p-5 flex flex-col gap-3.5`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display font-bold text-[18px] text-ink">גולש {i + 1}</span>
                  {people.length > 1 && (
                    <button type="button" onClick={() => setPeople(ps => ps.filter((_, j) => j !== i))} className="text-muted hover:text-danger text-[14px] px-1">הסרה</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="על מה גולשים">
                  {(["ski", "snowboard"] as GearKind[]).map(k => (
                    <button key={k} type="button" onClick={() => set(i, "kind", k)} aria-pressed={p.kind === k}
                      className={`rounded-2xl border-2 px-4 py-3 text-start transition-colors ${p.kind === k ? "border-accent bg-accent-soft" : "border-line bg-white hover:border-line-strong"}`}>
                      <span className="block text-[24px] leading-none" aria-hidden="true">{k === "ski" ? "⛷️" : "🏂"}</span>
                      <span className="block font-bold text-[16px] text-ink mt-1.5">{k === "ski" ? "סקי" : "סנובורד"}</span>
                      <span className="block text-[13px] text-muted">כולל נעליים</span>
                    </button>
                  ))}
                </div>
                <label><span className={fieldLabel}>שם מלא באנגלית</span>
                  <input className={field} dir="auto" placeholder="Full name" value={p.name} onChange={e => set(i, "name", e.target.value)} />
                  {p.name.trim() && !latin(p.name) && <span className="block text-[13px] text-muted mt-1">אפשר גם ככה. אם תכתבו באנגלית, בחנות יזהו אתכם מהר יותר.</span>}
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer min-h-[40px]">
                    <input type="checkbox" className="w-5 h-5 accent-accent" checked={!!p.helmet} onChange={e => set(i, "helmet", e.target.checked)} />
                    <span className="text-[15px] text-ink font-bold">⛑️ קסדה</span>
                    <span className="text-[14px] text-muted">+€{HELMET_PRICE} לכל התקופה</span>
                  </label>
                  {days > 0 && <span className="text-[15px] text-muted">לגולש: <b className="text-ink">{eur(personCost(days, p))}</b></span>}
                </div>
              </div>
            ))}
          </div>
          {people.length < 20 && (
            <button type="button" onClick={() => setPeople(ps => [...ps, blank()])} className={`${btn.pill} self-start`}>+ מצרפים עוד חבר</button>
          )}
        </section>
      </div>

      {/* summary + pay */}
      <aside className={`${card} p-5 md:p-6 flex flex-col gap-4 lg:sticky lg:top-24`}>
        <h2 className="font-display font-bold text-[21px] text-ink">כמה יוצא לחבר&apos;ה?</h2>
        <div className="flex flex-col gap-1.5 text-[15px]">
          {ready.length ? ready.map((p, i) => (
            <div key={i} className="flex justify-between gap-3"><span className="text-body" dir="auto">{p.name} · {p.kind === "ski" ? "סקי" : "סנובורד"}{p.helmet ? " + קסדה" : ""}</span><span className="font-bold">{days ? eur(personCost(days, p)) : "—"}</span></div>
          )) : <p className="text-muted">הוסיפו שמות ותאריכים, והמחיר יופיע כאן.</p>}
        </div>
        <div className="flex justify-between items-baseline border-t border-line pt-3">
          <span className="text-muted">סה״כ</span>
          <span className="font-display font-extrabold text-[30px] text-ink">{total ? eur(total) : "—"}</span>
        </div>
        <table className="w-full text-[14px]">
          <tbody className="divide-y divide-line">
            {[["יום אחד", "€30"], ["2–3 ימים", "€30 ליום"], ["4–6 ימים", "€120"], ["כל יום אחרי 6", "+€20"], ["קסדה לכל התקופה", `+€${HELMET_PRICE}`], ["נעליים", "כלולות"]].map(([k, v]) => (
              <tr key={k}><td className="py-1.5 text-muted">{k}</td><td className="py-1.5 text-end font-bold text-ink">{v}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="text-[12px] text-muted -mt-2">מחיר לגולש, מגלשיים או סנובורד. ביטוח ציוד לא כלול.</p>
        <a href={GEAR_SHOP.maps} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-soft hover:bg-soft-2 transition-colors px-4 py-3.5 flex flex-col gap-2 text-[14px] text-body leading-relaxed">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={GEAR_SHOP.logo} alt={GEAR_SHOP.name} width={176} height={35} className="h-[35px] w-auto self-start" />
          <span>הציוד מחכה לכם מוכן בחנות. מגיעים, מראים את מייל ההזמנה, ויוצאים לגלוש.</span>
          <span className="text-[13px] text-muted" dir="ltr">{GEAR_SHOP.address}</span>
          <span className="font-bold text-accent">לחנות במפה ←</span>
        </a>

        <div className="flex flex-col gap-2" role="radiogroup" aria-label="איך בא לכם לשלם?">
          <span className="font-bold text-[15px] text-ink">איך בא לכם לשלם?</span>
          {[{ v: false, t: "משלמים עכשיו בכרטיס", d: "תשלום מאובטח, והמייל לחנות יוצא מיד" }, { v: true, t: "מזמינים עכשיו, משלמים אחר כך", d: "שולחים לכם קישור תשלום בוואטסאפ לפני שמגיעים לחנות" }].map(o => (
            <button key={o.t} type="button" role="radio" aria-checked={later === o.v} onClick={() => setLater(o.v)}
              className={`rounded-2xl border-2 px-3.5 py-2.5 text-start transition-colors ${later === o.v ? "border-accent bg-accent-soft" : "border-line bg-white hover:border-line-strong"}`}>
              <span className="block font-bold text-[15px] text-ink">{o.t}</span>
              <span className="block text-[13px] text-muted">{o.d}</span>
            </button>
          ))}
        </div>

        {nextStep ? (
          <button type="button" onClick={() => goTo(nextStep.go)} className={`${btn.primaryLg} w-full`}>{nextStep.label}</button>
        ) : !later ? (
          <CardPaymentButton apartment={`השכרת ציוד · ${GEAR_SHOP.name}`} checkin={from} checkout={nextDay(to)}
            guests={ready.length} nights={days} equipment grandTotal={total} gear={gear}
            label="המשך לתשלום מאובטח" className={`${btn.primaryLg} w-full`} />
        ) : (
          <div className="flex flex-col gap-2.5">
            <input className={field} placeholder="השם שלכם" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} />
            <input className={field} type="email" dir="ltr" placeholder="Email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} />
            <input className={field} type="tel" dir="ltr" placeholder="Phone (WhatsApp)" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} />
            <button type="button" onClick={orderLater} disabled={busy} className={`${btn.primaryLg} w-full disabled:opacity-60`}>{busy ? "מסדרים לכם ציוד…" : "יאללה, שריינו לי ציוד"}</button>
            <p className="text-[13px] text-muted">לתשלום עכשיו: €0. נשלח לכם קישור תשלום בוואטסאפ לפני שמגיעים לחנות.</p>
          </div>
        )}
        {err && <p className="text-[14px] text-danger font-bold">{err}</p>}
      </aside>
    </div>
  );
}
