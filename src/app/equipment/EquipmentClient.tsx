"use client";
import { useState } from "react";
import CardPaymentButton from "@/components/CardPaymentButton";
import { wrap, card, h2, btn, field, fieldLabel } from "@/components/ui";
import { equipCost } from "@/lib/pricing";
import { GEAR_SHOP, HELMET_PRICE, gearDays, personCost, type GearKind, type GearPerson } from "@/lib/gear";

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const today = () => new Date().toISOString().slice(0, 10);
const nextDay = (iso: string) => new Date(Date.parse(iso + "T12:00:00Z") + 864e5).toISOString().slice(0, 10);
const blank = (kind: GearKind = "ski"): GearPerson => ({ name: "", kind, height: "", weight: "", shoe: "", helmet: false });

/*
 * Rent skis or a snowboard from us, for anyone in Val Thorens: the dates, one
 * row per person (name in English, as the shop sees it, and sizes), then pay
 * by card now or order now and pay later. The gear waits at Caron Skishop.
 */
export default function EquipmentClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [people, setPeople] = useState<GearPerson[]>([blank(), blank("snowboard")]);
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
    ready.some(p => !/^[A-Za-z][A-Za-z .'-]*$/.test(p.name.trim())) && "שמות באותיות באנגלית",
  ].filter(Boolean) as string[];

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
        <section className="flex flex-col gap-3">
          <h2 className={h2}>מתי גולשים?</h2>
          <div className="grid grid-cols-2 gap-3 max-w-[520px]">
            <label><span className={fieldLabel}>יום ראשון של גלישה</span>
              <input type="date" className={field} min={today()} value={from} onChange={e => { setFrom(e.target.value); if (to && e.target.value > to) setTo(""); }} />
            </label>
            <label><span className={fieldLabel}>יום אחרון של גלישה</span>
              <input type="date" className={field} min={from || today()} value={to} onChange={e => setTo(e.target.value)} />
            </label>
          </div>
          {days > 0 && <p className="text-[15px] text-muted">{days} ימי גלישה · {eur(perPerson)} לאדם</p>}
        </section>

        {/* people */}
        <section className="flex flex-col gap-3">
          <h2 className={h2}>מי גולש?</h2>
          <p className="text-[15px] text-muted -mt-1">שם באנגלית, כמו שיופיע בחנות. את המידות צריך כדי שהציוד יחכה מוכן.</p>
          <div className="flex flex-col gap-3">
            {people.map((p, i) => (
              <div key={i} className={`${card} p-4 md:p-5 flex flex-col gap-3`}>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex-1 min-w-[200px]"><span className={fieldLabel}>שם באנגלית</span>
                    <input className={field} dir="ltr" placeholder="Full name" value={p.name} onChange={e => set(i, "name", e.target.value)} />
                  </label>
                  <div className="flex rounded-xl border border-line-strong overflow-hidden" role="group" aria-label="סוג ציוד">
                    {(["ski", "snowboard"] as GearKind[]).map(k => (
                      <button key={k} type="button" onClick={() => set(i, "kind", k)} aria-pressed={p.kind === k}
                        className={`min-h-[48px] px-4 text-[15px] font-bold transition-colors ${p.kind === k ? "bg-ink text-white" : "bg-white text-body hover:bg-soft"}`}>
                        {k === "ski" ? "⛷️ סקי" : "🏂 סנובורד"}
                      </button>
                    ))}
                  </div>
                  {people.length > 1 && (
                    <button type="button" onClick={() => setPeople(ps => ps.filter((_, j) => j !== i))} className="min-h-[48px] px-2 text-muted hover:text-danger text-[14px]">הסרה</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label><span className={fieldLabel}>גובה (ס״מ)</span><input className={field} inputMode="numeric" value={p.height} onChange={e => set(i, "height", e.target.value.replace(/\D/g, ""))} /></label>
                  <label><span className={fieldLabel}>משקל (ק״ג)</span><input className={field} inputMode="numeric" value={p.weight} onChange={e => set(i, "weight", e.target.value.replace(/\D/g, ""))} /></label>
                  <label><span className={fieldLabel}>מידת נעל (EU)</span><input className={field} inputMode="decimal" value={p.shoe} onChange={e => set(i, "shoe", e.target.value.replace(/[^\d.]/g, ""))} /></label>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer self-start min-h-[40px]">
                  <input type="checkbox" className="w-5 h-5 accent-accent" checked={!!p.helmet} onChange={e => set(i, "helmet", e.target.checked)} />
                  <span className="text-[15px] text-ink font-bold">⛑️ להוסיף קסדה</span>
                  <span className="text-[14px] text-muted">+€{HELMET_PRICE} לכל התקופה</span>
                </label>
              </div>
            ))}
          </div>
          {people.length < 20 && (
            <button type="button" onClick={() => setPeople(ps => [...ps, blank()])} className={`${btn.pill} self-start`}>+ עוד גולש</button>
          )}
        </section>
      </div>

      {/* summary + pay */}
      <aside className={`${card} p-5 md:p-6 flex flex-col gap-4 lg:sticky lg:top-24`}>
        <h2 className="font-display font-bold text-[21px] text-ink">כמה יוצא לנו?</h2>
        <div className="flex flex-col gap-1.5 text-[15px]">
          {ready.length ? ready.map((p, i) => (
            <div key={i} className="flex justify-between gap-3"><span className="text-body" dir="auto">{p.name} · {p.kind === "ski" ? "סקי" : "סנובורד"}{p.helmet ? " + קסדה" : ""}</span><span className="font-bold">{days ? eur(personCost(days, p)) : "—"}</span></div>
          )) : <p className="text-muted">הוסיפו שמות ותאריכים, והמחיר יופיע כאן.</p>}
        </div>
        <div className="flex justify-between items-baseline border-t border-line pt-3">
          <span className="text-muted">סה״כ</span>
          <span className="font-display font-extrabold text-[30px] text-ink">{total ? eur(total) : "—"}</span>
        </div>
        <p className="text-[13px] text-muted leading-relaxed">€30 ליום, €120 ל-6 ימים, ועוד €20 לכל יום נוסף. לאדם. מגלשיים או סנובורד, כולל נעליים. קסדה €{HELMET_PRICE} נוספים. לא כולל ביטוח על הציוד.</p>
        <div className="rounded-2xl bg-soft px-4 py-3 text-[14px] text-body leading-relaxed">
          📍 הציוד מחכה לכם ב-<a href={GEAR_SHOP.maps} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline">{GEAR_SHOP.name}</a> בואל טורנס. מגיעים, מראים את מייל ההזמנה, ויוצאים לגלוש.
        </div>

        <div className="flex rounded-xl border border-line-strong overflow-hidden" role="group" aria-label="איך משלמים">
          <button type="button" onClick={() => setLater(false)} aria-pressed={!later} className={`flex-1 min-h-[46px] text-[15px] font-bold ${!later ? "bg-ink text-white" : "bg-white text-body"}`}>משלמים עכשיו</button>
          <button type="button" onClick={() => setLater(true)} aria-pressed={later} className={`flex-1 min-h-[46px] text-[15px] font-bold ${later ? "bg-ink text-white" : "bg-white text-body"}`}>משלמים אחר כך</button>
        </div>

        {!later ? (
          missing.length ? (
            <button type="button" disabled className={`${btn.primaryLg} w-full opacity-50 cursor-not-allowed`}>יאללה, מזמינים ציוד</button>
          ) : (
            <CardPaymentButton apartment={`השכרת ציוד · ${GEAR_SHOP.name}`} checkin={from} checkout={nextDay(to)}
              guests={ready.length} nights={days} equipment grandTotal={total} gear={gear}
              label="יאללה, מזמינים ציוד" className={`${btn.primaryLg} w-full`} />
          )
        ) : (
          <div className="flex flex-col gap-2.5">
            <input className={field} placeholder="השם שלכם" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} />
            <input className={field} type="email" dir="ltr" placeholder="Email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} />
            <input className={field} type="tel" dir="ltr" placeholder="Phone (WhatsApp)" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} />
            <button type="button" onClick={orderLater} disabled={busy} className={`${btn.primaryLg} w-full disabled:opacity-60`}>{busy ? "שולחים…" : "יאללה, מזמינים ציוד"}</button>
            <p className="text-[13px] text-muted">את התשלום נסגור איתכם בוואטסאפ לפני שמגיעים לחנות.</p>
          </div>
        )}
        {missing.length > 0 && <p className="text-[13px] text-muted">כדי להזמין חסר: {missing.join(", ")}</p>}
        {err && <p className="text-[14px] text-danger font-bold">{err}</p>}
      </aside>
    </div>
  );
}
