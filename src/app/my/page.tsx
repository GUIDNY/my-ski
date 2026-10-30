"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import { IconWhatsApp } from "@/components/Icons";
import { buildWaHref } from "@/lib/whatsapp";
import { authFetch } from "@/lib/auth-fetch";
import { isAdminEmail } from "@/lib/admins";
import OpenChatButton from "@/components/OpenChatButton";
import { PageTop, EmptyState, btn, card, field, fieldLabel, h3, wrap, Check, badgeLight, badgeDark } from "@/components/ui";

type OrderView = {
  code: string; apartment_name: string; area: string;
  checkin: string | null; checkout: string | null; guests: number; nights: number;
  ski_pass: boolean; transfer: boolean; total_eur: number; status: string; customer_name: string;
  equipment?: boolean; flight?: boolean; flight_details?: string | null; transfer_details?: string | null;
  pass3v?: boolean; extra_apartment_name?: string | null;
  onlineCheckin?: { guests: string[]; arrival: string; phone: string; notes: string; at: string } | null;
  stay?: { address: string; ref: string; notes: string } | null; stayReady?: boolean;
  flightCheckin?: { airline: string; pnr: string; url: string; out: FLeg; ret: FLeg } | null;
  proposalId?: string | null;
  apartment?: { images?: string[] } | null;
  share_amount?: number | null; shares_total?: number | null;
  group?: { code: string; shares_total: number; shares_paid: number } | null;
};
type FLeg = { date: string; time: string; no: string; arr?: string; airport?: string };
type Apt = { id: string; name: string; type: string; images: string[]; price_per_night: number; beds: number; baths: number; sqm: number };
type Saved = {
  id: string; checkin: string | null; checkout: string | null; guests: number;
  apartment: Apt | null;
  extra_apartment?: Apt | null;
};

const HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const fmt = (s: string | null) => { if (!s) return "לא נקבע"; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ב${HE[d.getMonth()]} ${d.getFullYear()}`; };
const fmtRange = (a: string | null, b: string | null) => {
  if (!a || !b) return "בלי תאריכים";
  const x = new Date(a + "T12:00:00"), y = new Date(b + "T12:00:00");
  return x.getMonth() === y.getMonth()
    ? `\u2066${x.getDate()}\u2060–\u2060${y.getDate()}\u2069 ב${HE[y.getMonth()]} ${y.getFullYear()}`
    : `${x.getDate()} ב${HE[x.getMonth()]} עד ${y.getDate()} ב${HE[y.getMonth()]} ${y.getFullYear()}`;
};
const fmtShort = (s: string | null) => { if (!s) return ""; const d = new Date(s + "T12:00:00"); return `${d.getDate()} ב${HE[d.getMonth()]}`; };
const daysUntil = (s: string | null) => { if (!s) return null; const d = new Date(s + "T12:00:00"); return Math.ceil((d.getTime() - Date.now()) / 86400000); };
const eur = (n: number) => `€${Number(n || 0).toLocaleString("en-US")}`;

const FAQ = [
  { q: "מתי נכנסים ומתי יוצאים מהדירה?", a: "כניסה מ-16:00, יציאה עד 10:00. את השעות המדויקות מתאמים איתכם לפני ההגעה." },
  { q: "מה כדאי להביא?", a: "ביגוד תרמי, כפפות ומשקפי סקי, קרם הגנה, ודרכון בתוקף לפחות 6 חודשים. ציוד אפשר לשכור במקום." },
  { q: "איך מקבלים את המפתחות?", a: "את פרטי הכניסה והמפתחות נשלח לכם כמה ימים לפני ההגעה." },
  { q: "ומה אם צריך לבטל?", a: "מדיניות הביטולים המלאה מופיעה בתקנון, ואפשר לפנות אלינו בכל שלב." },
];

// how each order status reads to the guest
const STATUS: Record<string, { label: string; tone: "ok" | "warn" | "danger" }> = {
  approved:  { label: "מאושר",        tone: "ok" },
  hold:      { label: "ממתין לאישור", tone: "warn" },
  awaiting:  { label: "ממתין לאישור", tone: "warn" },
  cancelled: { label: "בוטל",          tone: "danger" },
};
const statusOf = (s: string) => STATUS[s] ?? STATUS.awaiting;
const TONE_DOT = { ok: "bg-ok", warn: "bg-warn", danger: "bg-danger" } as const;

/* ---- small icons (stroke, follow the text color) ---- */
const ico = (d: React.ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">{d}</svg>
);
const IcoCal = () => ico(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
const IcoPeople = () => ico(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>);
const IcoLink = () => ico(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>);
const IcoHeart = ({ filled = false }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
);
const IcoClose = () => ico(<path d="M6 6l12 12M18 6L6 18" />, 20);
const IcoChat = () => ico(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />);
const IcoOut = () => ico(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>);
const IcoTrash = () => ico(<><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" /><path d="M10 11v6M14 11v6" /></>);

function StatusBadge({ status }: { status: string }) {
  const st = statusOf(status);
  return (
    <span className={`${badgeLight} gap-1.5`}>
      <span className={`w-2 h-2 rounded-full ${TONE_DOT[st.tone]}`} aria-hidden="true" />{st.label}
    </span>
  );
}

function Countdown({ checkin }: { checkin: string | null }) {
  const d = daysUntil(checkin);
  if (d == null || d < 0) return null;
  return <span className={badgeDark}>{d === 0 ? "היום!" : d === 1 ? "מחר" : `בעוד ${d} ימים`}</span>;
}

function OrderCard({ o: initial, onMore }: { o: OrderView; onMore?: (o: OrderView) => void }) {
  const [o, setO] = useState(initial);
  const img = o.apartment?.images?.[0] ?? "/view.jpg";
  const approved = o.status === "approved";
  const wa = buildWaHref({ intro: "היי, יש לי שאלה על ההזמנה שלי", lines: [`קוד הזמנה: ${o.code}`, `${o.apartment_name}, ${fmtRange(o.checkin, o.checkout)}`] });
  const included = [o.flight && "טיסה", o.ski_pass && (o.pass3v ? "סקי פס שלושת העמקים" : "סקי פס"), o.transfer && "הסעה מהשדה", o.equipment && "ציוד סקי"].filter(Boolean) as string[];
  return (
    <article className={`${card} overflow-hidden flex flex-col sm:flex-row`}>
      <div className="relative shrink-0 h-[190px] sm:h-auto sm:min-h-[230px] sm:w-[280px] lg:w-[300px] bg-soft-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={o.apartment_name} className="absolute inset-0 w-full h-full object-cover" />
        <span className="absolute top-3.5 right-3.5"><StatusBadge status={o.status} /></span>
        <span className="absolute bottom-3.5 right-3.5"><Countdown checkin={o.checkin} /></span>
      </div>
      <div className="flex-1 min-w-0 p-5 md:p-6 flex flex-col gap-3.5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h3 className={h3}>{o.apartment_name}</h3>
            {o.area && <div className="text-[15px] text-muted mt-0.5">{o.area}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-body">
          <span className="flex items-center gap-2"><IcoCal />{fmtRange(o.checkin, o.checkout)}</span>
          <span className="flex items-center gap-2"><IcoPeople />{o.guests} אורחים · {o.nights} לילות</span>
          {o.customer_name && <span className="flex items-center gap-2 min-w-0"><IcoUserSm /><span className="truncate">על שם {o.customer_name}</span></span>}
        </div>
        {included.length > 0 && (
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] text-ink">
            {included.map(i => <li key={i} className="flex items-center gap-2"><Check />{i}</li>)}
          </ul>
        )}
        {o.status === "hold" && <p className="text-[14px] text-body">הפיקדון התקבל. ההזמנה ממתינה לאישור שלנו.</p>}
        {o.group && <GroupProgress group={o.group} />}
        {o.flightCheckin && (o.status === "approved" || o.status === "hold") && <FlightCheckinBox f={o.flightCheckin} />}
        <CheckinBox o={o} onDone={v => setO(x => ({ ...x, ...v }))} />
        <div className="mt-auto pt-3.5 border-t border-line flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onMore?.(o)} className={`${btn.outline} w-full sm:w-auto min-h-[44px] px-4 text-[15px]`}>פרטי ההזמנה</button>
          <a href={wa} target="_blank" rel="noopener noreferrer" className={`${btn.pill} w-full sm:w-auto gap-2`}>
            <span className="text-[#128C4B]"><IconWhatsApp size={17} /></span>שאלה על ההזמנה
          </a>
          <span className="w-full sm:w-auto sm:ms-auto flex items-center justify-between sm:justify-start gap-3 pt-1 sm:pt-0 text-[13px] text-muted">
            {approved && <span className="flex items-center gap-1 font-bold text-ok-text"><Check size={14} />שולם</span>}
            <span>קוד <span dir="ltr" className="font-mono">{o.code}</span></span>
          </span>
        </div>
      </div>
    </article>
  );
}

function GroupProgress({ group }: { group: { code: string; shares_total: number; shares_paid: number } }) {
  const [copied, setCopied] = useState(false);
  const pct = Math.min(100, Math.round((group.shares_paid / group.shares_total) * 100));
  const done = group.shares_paid >= group.shares_total;
  const link = typeof window !== "undefined" ? `${window.location.origin}/split/${group.code}` : "";
  return (
    <div className="rounded-2xl bg-soft border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 mb-2">
        <span className="text-[15px] font-bold text-ink">כל אחד משלם את החלק שלו</span>
        <span className={`text-[14px] font-bold ${done ? "text-ok-text" : "text-accent"}`}>{group.shares_paid} מתוך {group.shares_total} שילמו</span>
      </div>
      <div className="h-2.5 rounded-full bg-white border border-line overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="כמה מהחבורה שילמו">
        <div className={`h-full rounded-full transition-all duration-500 ${done ? "bg-ok" : "bg-accent"}`} style={{ width: `${pct}%` }} />
      </div>
      {done ? (
        <p className="text-[14px] font-bold text-ok-text mt-2.5">כולם שילמו. ההזמנה הושלמה!</p>
      ) : (
        <button type="button" onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className={`${btn.primary} w-full mt-3 min-h-[44px] text-[15px]`}>
          {copied ? <><Check size={16} className="[&>path]:stroke-white" />הקישור הועתק, אפשר לשלוח לחברים</> : <><IcoLink />להעתיק את קישור התשלום לחברים</>}
        </button>
      )}
    </div>
  );
}

/* Flight check-in: the airline's check-in page and the booking code to copy
   (an email reminds the guest 24 hours before each flight). */
function FlightCheckinBox({ f }: { f: NonNullable<OrderView["flightCheckin"]> }) {
  const [copied, setCopied] = useState(false);
  const legLine = (label: string, l: FLeg) => l.date
    ? <p className="text-[14px] text-body"><span className="font-bold text-ink">{label}:</span> {fmtShort(l.date)}{l.time ? `, ${l.time}` : ""}{l.no ? <> · <span dir="ltr">{l.no}</span></> : null}{l.arr ? ` · נחיתה ב${l.airport === "LYS" ? "ליון" : "ז׳נבה"} ${l.arr}` : ""}</p>
    : null;
  return (
    <div className="rounded-2xl border border-line p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-[15px] text-ink">צ׳ק-אין לטיסה · {f.airline}</p>
        <span className="text-accent shrink-0"><IcoPlaneSm /></span>
      </div>
      <div className="flex flex-col gap-0.5">{legLine("הלוך", f.out)}{legLine("חזור", f.ret)}</div>
      {f.pnr && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-2.5">
          <span className="text-[14px] text-muted">קוד ההזמנה בחברת התעופה</span>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(f.pnr); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-2 font-mono font-bold text-[17px] text-ink" dir="ltr" aria-label="העתקת קוד ההזמנה">
            {f.pnr}<span className="text-[12px] font-sans font-bold text-accent">{copied ? "הועתק" : "העתקה"}</span>
          </button>
        </div>
      )}
      {f.url && (
        <a href={f.url} target="_blank" rel="noopener noreferrer" className={`${btn.primary} w-full min-h-[44px]`}>לצ׳ק-אין באתר {f.airline}</a>
      )}
      <p className="text-[13px] text-muted">הצ׳ק-אין נפתח בדרך כלל 24 עד 30 שעות לפני הטיסה. נשלח לכם מייל תזכורת יום לפני כל טיסה.</p>
    </div>
  );
}
const IcoUserSm = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
const IcoPlaneSm = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
);

/* Online check-in: the guests' names, arrival time and a phone for the day; after it,
   the arrival details Idan entered in the admin (address, booking code, how to get in). */
function CheckinBox({ o, onDone }: { o: OrderView; onDone: (v: Partial<OrderView>) => void }) {
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<string[]>(() => {
    // the order often carries all the guests' names ("ליהוא ידלין, שחר דול, יותם סופר"): one per field
    const given = String(o.customer_name || "").split(/\s*[,+]\s*| ו-\s*/).map(x => x.trim()).filter(Boolean);
    return Array.from({ length: Math.max(1, o.guests || 1, given.length) }, (_, i) => given[i] || "");
  });
  const [arrival, setArrival] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (o.status !== "approved" && o.status !== "hold") return null;
  const done = o.onlineCheckin;

  const submit = async () => {
    setErr("");
    if (!names.some(n => n.trim()) || !phone.trim()) { setErr("צריך לפחות שם אחד ומספר טלפון"); return; }
    setBusy(true);
    const r = await fetch(`/api/orders/code/${encodeURIComponent(o.code)}/checkin`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests: names, arrival, phone, notes }),
    }).catch(() => null);
    setBusy(false);
    const j = r ? await r.json().catch(() => null) : null;
    if (!r?.ok || !j?.ok) { setErr("משהו השתבש, נסו שוב עוד רגע"); return; }
    onDone({ onlineCheckin: j.onlineCheckin, stay: j.stay, stayReady: j.stayReady });
    setOpen(false);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-ok/30 bg-ok-soft p-4 flex flex-col gap-2.5">
        <p className="flex items-center gap-2 font-bold text-[15px] text-ok-text"><Check size={16} />הצ׳ק-אין לדירה בוצע</p>
        {o.stay ? (
          <div className="flex flex-col gap-2 text-[15px] text-ink">
            {o.stay.address && <p><span className="text-muted">כתובת: </span><span className="font-bold">{o.stay.address}</span>{" "}
              <a className="text-accent font-bold underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.stay.address)}`}>במפה</a></p>}
            {o.stay.ref && <p><span className="text-muted">קוד הזמנה לקבלה: </span><span dir="ltr" className="font-mono font-bold">{o.stay.ref}</span></p>}
            {o.stay.notes && <p className="whitespace-pre-line text-body">{o.stay.notes}</p>}
          </div>
        ) : (
          <p className="text-[14px] text-body">כתובת הדירה ופרטי הכניסה יופיעו כאן לפני ההגעה.</p>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="rounded-2xl border border-line p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <p className="font-bold text-[15px] text-ink">צ׳ק-אין לדירה</p>
          <p className="text-[14px] text-body">2 דקות, ואחרי זה תראו כאן את הכתובת ואת פרטי הכניסה לדירה.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={`${btn.primary} shrink-0 min-h-[44px] px-5`}>לצ׳ק-אין לדירה</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line p-4 flex flex-col gap-3">
      <p className="font-bold text-[16px] text-ink">צ׳ק-אין לדירה</p>
      <div className="flex flex-col gap-2">
        <span className={fieldLabel}>שמות האורחים (כמו בדרכון)</span>
        {names.map((n, i) => (
          <input key={i} value={n} onChange={e => setNames(v => v.map((x, j) => j === i ? e.target.value : x))}
            placeholder={`אורח ${i + 1}`} className={field} autoComplete={i === 0 ? "name" : "off"} />
        ))}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>מתי תגיעו לדירה בערך?</span>
        <input value={arrival} onChange={e => setArrival(e.target.value)} placeholder="למשל 17:30, או אחרי הנחיתה בליון" className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>טלפון ליום ההגעה</span>
        <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" dir="ltr" autoComplete="tel" placeholder="050-0000000" className={`${field} text-right`} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>משהו שחשוב שנדע? (לא חובה)</span>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${field} py-2.5`} />
      </label>
      {err && <p role="alert" className="text-[14px] text-danger">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={busy} className={`${btn.primary} flex-1 min-h-[44px]`}>{busy ? "שולח…" : "סיום הצ׳ק-אין לדירה"}</button>
        <button type="button" onClick={() => setOpen(false)} className={`${btn.outline} min-h-[44px] px-4`}>ביטול</button>
      </div>
    </div>
  );
}

function OrderModal({ o, onClose }: { o: OrderView; onClose: () => void }) {
  const approved = o.status === "approved";
  const imgs = o.apartment?.images?.length ? o.apartment.images : ["/view.jpg"];
  const [pic, setPic] = useState(0);
  const skiDays = Math.max((o.nights || 0) - 1, 0);
  const addons: { label: string; on: boolean; detail?: string }[] = [
    { label: "טיסה", on: !!o.flight, detail: o.flight_details || "טיסה ישירה, הלוך וחזור" },
    { label: o.pass3v ? "סקי פס מורחב: שלושת העמקים" : "סקי פס ואל טורנס",
      on: o.ski_pass,
      detail: o.pass3v ? `${skiDays ? `${skiDays} ימי סקי, ` : ""}כל 3 העמקים: ואל טורנס, מריבל, קורשבל ועוד` : `${skiDays ? `${skiDays} ימי סקי, ` : ""}ואל טורנס ואורל` },
    { label: "הסעה מהשדה", on: o.transfer, detail: o.transfer_details || "הלוך וחזור, מהשדה עד הדירה" },
    { label: "ציוד סקי או סנובורד", on: !!o.equipment, detail: `${skiDays ? `${skiDays} ימים, ` : ""}סקי או סנובורד, מגפיים וקסדה` },
  ];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-ink/45 md:p-6" onClick={onClose} dir="rtl">
      <div role="dialog" aria-modal="true" aria-label={`פרטי ההזמנה, ${o.apartment_name}`}
        className="bg-white w-full md:max-w-[520px] max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-[24px] md:rounded-card shadow-pop"
        onClick={e => e.stopPropagation()}>
        <div className="relative h-56 md:h-64 bg-soft-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[pic] ?? imgs[0]} alt={o.apartment_name} className="w-full h-full object-cover md:rounded-t-card" />
          {imgs.length > 1 && (
            <>
              <button type="button" aria-label="התמונה הקודמת" onClick={() => setPic(p => (p - 1 + imgs.length) % imgs.length)}
                className="absolute top-1/2 -translate-y-1/2 right-3 w-10 h-10 rounded-full bg-white/90 text-ink text-[20px] leading-none shadow-card">›</button>
              <button type="button" aria-label="התמונה הבאה" onClick={() => setPic(p => (p + 1) % imgs.length)}
                className="absolute top-1/2 -translate-y-1/2 left-3 w-10 h-10 rounded-full bg-white/90 text-ink text-[20px] leading-none shadow-card">‹</button>
              <span className="absolute bottom-3.5 left-3.5 rounded-full bg-ink/70 text-white text-[12px] font-bold px-2.5 py-1">{pic + 1}/{imgs.length}</span>
            </>
          )}
          <button type="button" onClick={onClose} aria-label="סגירה"
            className="absolute top-3 left-3 w-11 h-11 rounded-full bg-white text-ink flex items-center justify-center shadow-card"><IcoClose /></button>
          <span className="absolute bottom-3.5 right-3.5"><StatusBadge status={o.status} /></span>
        </div>
        <div className="p-5 md:p-6 flex flex-col gap-5" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          <div>
            <h2 className="font-display font-bold text-[24px] text-ink">{o.apartment_name}{o.extra_apartment_name ? ` + ${o.extra_apartment_name}` : ""}</h2>
            {o.area && <p className="text-[15px] text-muted">{o.area}</p>}
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
              {imgs.map((u, i) => (
                <button key={u + i} type="button" onClick={() => setPic(i)} aria-label={`תמונה ${i + 1}`}
                  className={`shrink-0 w-[72px] h-[54px] rounded-lg overflow-hidden border-2 ${i === pic ? "border-ink" : "border-transparent"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <Info label="כניסה" value={fmt(o.checkin)} />
            <Info label="יציאה" value={fmt(o.checkout)} />
            <Info label="אורחים" value={`${o.guests}`} />
            <Info label="לילות" value={`${o.nights}`} />
          </div>
          {o.customer_name && <div className="rounded-xl bg-soft px-4 py-3"><p className="text-[13px] text-muted mb-0.5">ההזמנה על שם</p><p className="font-bold text-[15px] text-ink">{o.customer_name}</p></div>}
          <div>
            <p className="font-bold text-[15px] text-ink mb-2">מה כלול</p>
            <div className="flex flex-col gap-2">
              {addons.map(a => (
                <div key={a.label} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-2.5 min-h-[48px]">
                  <span className="min-w-0">
                    <span className={`block text-[15px] ${a.on ? "text-ink font-bold" : "text-muted"}`}>{a.label}</span>
                    {a.on && a.detail && <span className="block text-[13px] text-body mt-0.5">{a.detail}</span>}
                  </span>
                  {a.on
                    ? <span className="shrink-0 flex items-center gap-1.5 text-[14px] font-bold text-ok-text"><Check size={15} />כלול</span>
                    : <span className="shrink-0 text-[14px] text-muted">לא כלול</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-soft px-4 py-4">
            <span className="text-[15px] font-bold text-ink">{o.group ? "החלק שלכם" : approved ? "סה״כ ששולם" : "סה״כ ההזמנה"}</span>
            <span className="font-display font-extrabold text-[26px] text-ink">{eur(o.total_eur)}</span>
          </div>
          {o.proposalId && (
            <a href={`/p/${o.proposalId}`} target="_blank" rel="noopener noreferrer" className={`${btn.outline} w-full min-h-[44px]`}>ההצעה המלאה, עם כל הפרטים</a>
          )}
          <p className="text-center text-[13px] text-muted">קוד הזמנה: <span dir="ltr" className="font-mono">{o.code}</span></p>
        </div>
      </div>
    </div>
  );
}
const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-soft px-4 py-3">
    <p className="text-[13px] text-muted mb-0.5">{label}</p>
    <p className="font-bold text-[15px] text-ink">{value}</p>
  </div>
);

function SavedCard({ s, onRemove }: { s: Saved; onRemove: (id: string) => void }) {
  const a = s.apartment;
  if (!a) return null;
  const b = s.extra_apartment;
  const dates = s.checkin && s.checkout ? `${s.checkin}&checkout=${s.checkout}&guests=${s.guests}` : "";
  const href = b
    ? `/combo?a=${a.id}&b=${b.id}${dates ? `&checkin=${dates}` : ""}`
    : `/apartments/${a.id}${dates ? `?checkin=${dates}` : ""}`;
  const price = b ? a.price_per_night + b.price_per_night : a.price_per_night;
  const title = b ? `${a.name} + ${b.name}` : a.name;
  return (
    <article className={`${card} overflow-hidden flex flex-col`}>
      <div className="relative h-[190px] flex bg-soft-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.images?.[0] ?? "/view.jpg"} alt={a.name} className={`${b ? "w-1/2" : "w-full"} h-full object-cover`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {b && <img src={b.images?.[0] ?? "/view.jpg"} alt={b.name} className="w-1/2 h-full object-cover border-r-2 border-white" />}
        {b && <span className={`absolute top-3.5 right-3.5 ${badgeDark}`}>שתי דירות</span>}
        <button type="button" onClick={() => onRemove(s.id)} aria-label={`להסיר את ${title} מהשמורים`} title="להסיר מהשמורים"
          className="absolute top-3 left-3 w-11 h-11 rounded-full bg-white text-danger flex items-center justify-center shadow-card hover:scale-105 transition-transform">
          <IcoHeart filled />
        </button>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-1.5">
        <h3 className={h3}>{title}</h3>
        <p className="text-[15px] text-muted">{s.checkin && s.checkout ? `${fmtShort(s.checkin)} עד ${fmtShort(s.checkout)} · ${s.guests} אורחים` : "בלי תאריכים"}</p>
        <div className="mt-auto pt-4 flex items-end justify-between gap-3">
          <span className="flex items-baseline gap-1">
            <span className="font-display font-extrabold text-[22px] text-ink">{eur(price)}</span>
            <span className="text-[14px] text-muted">ללילה</span>
          </span>
          <Link href={href} className={`${btn.primary} min-h-[44px] px-5 text-[15px]`}>להזמנה</Link>
        </div>
      </div>
    </article>
  );
}

/* A taste of Val Thorens for the personal area: the facts guests ask about, and the site's own guides. */
function ValThorensInfo() {
  const facts = [
    { k: "גובה הכפר", v: "2,300 מ׳, הגבוה באירופה" },
    { k: "אזור הסקי", v: "שלושת העמקים, 600 ק״מ מסלולים" },
    { k: "שלג", v: "מובטח כל העונה, נובמבר עד מאי" },
    { k: "מהשדה לכפר", v: "כ-3 שעות נסיעה מז׳נבה או מליון" },
  ];
  const links = [
    { label: "מזג האוויר והשלג עכשיו", href: "/val-thorens-weather" },
    { label: "מה לארוז", href: "/guide/מה-לארוז-לחופשת-סקי" },
    { label: "מסלולי הסקי", href: "/guide/מסלולי-סקי-בואל-טורנס" },
    { label: "אפרה-סקי ומסעדות", href: "/guide/אפרה-סקי-ומסעדות-בואל-טורנס" },
    { label: "המדריך המלא", href: "/guide/המדריך-המלא-לואל-טורנס" },
  ];
  return (
    <section aria-label="לקראת ואל טורנס" className={`${card} p-5 md:p-6 flex flex-col gap-4`}>
      <div>
        <h2 className="font-display font-bold text-[21px] text-ink">לקראת ואל טורנס 🏔️</h2>
        <p className="text-[15px] text-body mt-1">כמה דברים ששווה להכיר לפני שמגיעים.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {facts.map(f => (
          <div key={f.k} className="rounded-xl bg-soft px-4 py-3">
            <p className="text-[13px] text-muted mb-0.5">{f.k}</p>
            <p className="font-bold text-[14px] text-ink">{f.v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map(l => (
          <Link key={l.href} href={l.href} className="inline-flex items-center min-h-[40px] px-3.5 rounded-full border border-line text-[14px] font-bold text-ink hover:border-ink transition-colors">
            {l.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function FAQBlock() {
  return (
    <section aria-labelledby="my-faq" className={`${card} p-5 md:p-6`}>
      <h2 id="my-faq" className="font-display font-bold text-[21px] text-ink mb-2">לפני הנסיעה</h2>
      <div className="flex flex-col">
        {FAQ.map((f, i) => (
          <details key={f.q} className={`group py-1 ${i > 0 ? "border-t border-line" : ""}`}>
            <summary className="list-none cursor-pointer flex items-center justify-between gap-4 min-h-[52px] font-bold text-[16px] text-ink">
              {f.q}
              <span aria-hidden="true" className="text-muted text-xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pb-4 text-[15px] leading-relaxed text-body">
              {f.a}{f.q.includes("לבטל") && <> <Link href="/terms" className="font-bold text-accent">לתקנון</Link></>}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function HelpCard({ wa }: { wa: string }) {
  return (
    <section className="rounded-card bg-ink text-white p-5 md:p-6 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-bold text-[21px]">צריכים משהו?</h2>
        <p className="text-[15px] text-[#D6DEEA] mt-1">שאלה על ההזמנה, שינוי או בקשה מיוחדת. עונים בעברית.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        <a href={wa} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-[14px] bg-white text-ink font-bold text-[16px] hover:bg-accent-soft transition-colors">
          <span className="text-[#128C4B]"><IconWhatsApp size={18} /></span>דברו איתנו בוואטסאפ
        </a>
        <OpenChatButton className="inline-flex items-center justify-center gap-2 min-h-[48px] rounded-[14px] border border-white/45 text-white font-bold text-[16px] hover:bg-white/10 transition-colors">
          <IcoChat />צ&apos;אט באתר
        </OpenChatButton>
      </div>
    </section>
  );
}

function CodeBox({ code, setCode, onSubmit, error, label, button }: { code: string; setCode: (s: string) => void; onSubmit: () => void; error: string; label: string; button: string }) {
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="flex flex-col gap-2">
      <label htmlFor="order-code" className={fieldLabel}>{label}</label>
      <div className="flex gap-2">
        <input id="order-code" value={code} onChange={e => setCode(e.target.value)} dir="ltr" autoComplete="off" autoCapitalize="none" spellCheck={false}
          placeholder="k7m2pq" className={`${field} flex-1 min-w-0 text-center font-mono tracking-wider`} />
        <button type="submit" className={`${btn.dark} shrink-0 px-5`}>{button}</button>
      </div>
      {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
    </form>
  );
}

type Tab = "orders" | "saved" | "account";

function MyOrder() {
  const params = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [single, setSingle] = useState<OrderView | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOrder, setModalOrder] = useState<OrderView | null>(null);
  const initialTab = params.get("tab");
  const [tab, setTab] = useState<Tab>(initialTab === "saved" || initialTab === "account" ? initialTab : "orders");

  const loadMine = useCallback(async (u: User) => {
    const [o, s] = await Promise.all([
      authFetch(`/api/orders/mine/${u.id}?email=${encodeURIComponent(u.email || "")}`).then(r => r.ok ? r.json() : []),
      authFetch(`/api/saved?uid=${u.id}`).then(r => r.ok ? r.json() : []),
    ]);
    setOrders(Array.isArray(o) ? o : []);
    setSaved(Array.isArray(s) ? s : []);
  }, []);

  const lookupSingle = async (c: string) => {
    if (!c) return; setError("");
    const r = await authFetch(`/api/orders/code/${encodeURIComponent(c.trim().toLowerCase())}`);
    if (r.ok) setSingle(await r.json()); else setError("לא מצאנו הזמנה עם הקוד הזה. בדקו אותו שוב, או כתבו לנו.");
  };

  const claim = async (c: string) => {
    if (!c || !user) return; setError("");
    const r = await authFetch("/api/orders/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c.trim().toLowerCase(), user_id: user.id }) });
    const j = await r.json();
    if (!r.ok) { setError(j.error || "לא הצלחנו לחבר את ההזמנה"); return; }
    setCode(""); loadMine(user);
  };

  const removeSaved = async (id: string) => {
    await authFetch(`/api/saved/${id}`, { method: "DELETE" });
    setSaved(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const urlCode = params.get("code") || "";
      if (session?.user) {
        setUser(session.user);
        if (urlCode) await authFetch("/api/orders/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: urlCode.toLowerCase(), user_id: session.user.id }) }).catch(() => {});
        await loadMine(session.user);
      } else if (urlCode) { setCode(urlCode); await lookupSingle(urlCode); }
      setLoading(false);
    });
  }, [params, loadMine]);

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };
  const deleteAccount = async () => {
    if (!confirm("למחוק את החשבון לצמיתות? כל הנתונים האישיים שלכם יימחקו, ואי אפשר לבטל את זה.")) return;
    if (!confirm("אישור אחרון: למחוק את החשבון?")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const r = await authFetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: session.access_token }) });
    if (r.ok) { await supabase.auth.signOut(); window.location.href = "/"; }
    else alert("לא הצלחנו למחוק את החשבון. נסו שוב או כתבו לנו בוואטסאפ.");
  };
  const wa = buildWaHref({ intro: "היי! יש לי שאלה על ההזמנה שלי 🎿", lines: [] });
  const name = user ? (user.user_metadata?.full_name || (user.email || "").split("@")[0]) : "";
  const firstName = String(name).trim().split(/\s+/)[0] || "";
  const isAdmin = isAdminEmail(user?.email);
  const initials = String(name).trim().split(/\s+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase();

  if (loading) return <SkiLoader />;

  /* ---------- GUEST (not signed in, no order) ---------- */
  if (!user && !single) {
    return (
      <div className="flex-1 bg-soft flex items-start md:items-center justify-center px-4 py-8 md:py-16" dir="rtl">
        <div className={`${card} w-full max-w-[460px] px-5 py-8 md:px-8 md:py-10 flex flex-col gap-6`}>
          <div className="flex flex-col items-center gap-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/skishare-mark.png" alt="" aria-hidden="true" className="h-8 w-auto" />
            <h1 className="font-display font-bold text-[28px] leading-tight text-ink">האזור האישי</h1>
            <p className="text-[15px] leading-relaxed text-muted max-w-[340px]">
              התחברו כדי לראות את ההזמנות שלכם ולשמור חופשות. קיבלתם קוד הזמנה במייל? אפשר להיכנס גם איתו.
            </p>
          </div>
          <Link href="/auth" className={`${btn.primary} w-full`}>כניסה / הרשמה</Link>
          <div className="flex items-center gap-3 text-[14px] text-muted" aria-hidden="true">
            <span className="flex-1 h-px bg-line" />או עם קוד הזמנה<span className="flex-1 h-px bg-line" />
          </div>
          <CodeBox code={code} setCode={setCode} onSubmit={() => lookupSingle(code)} error={error} label="קוד הזמנה" button="לצפייה" />
        </div>
      </div>
    );
  }

  /* ---------- SINGLE ORDER (guest with a code) ---------- */
  if (!user && single) {
    return (
      <div className="flex-1 bg-white" dir="rtl">
        <PageTop soft crumbs={[{ label: "דף הבית", href: "/" }, { label: "ההזמנה שלכם" }]}
          title="ההזמנה שלכם" sub={single.apartment_name} />
        <div className={`${wrap} py-8 md:py-10 flex flex-col gap-6`}>
          <OrderCard o={single} onMore={setModalOrder} />
          <ValThorensInfo />
          <div className={`${card} p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between`}>
            <p className="text-[16px] text-ink">רוצים שההזמנה תחכה לכם תמיד כאן? התחברו עם המייל שהזמנתם איתו.</p>
            <Link href="/auth" className={`${btn.dark} shrink-0`}>כניסה / הרשמה</Link>
          </div>
          <FAQBlock />
          <HelpCard wa={wa} />
        </div>
        {modalOrder && <OrderModal o={modalOrder} onClose={() => setModalOrder(null)} />}
      </div>
    );
  }

  /* ---------- SIGNED-IN ---------- */
  const tabs: { id: Tab; label: string; short: string; count?: number }[] = [
    { id: "orders", label: "ההזמנות שלי", short: "הזמנות", count: orders.length },
    { id: "saved", label: "חופשות שמורות", short: "שמורות", count: saved.length },
    { id: "account", label: "החשבון", short: "החשבון" },
  ];

  return (
    <div className="flex-1 bg-white" dir="rtl">
      <PageTop soft title={firstName ? `שלום, ${firstName}` : "האזור האישי"}
        sub="כאן ההזמנות שלכם והחופשות ששמרתם."
        aside={<Link href="/apartments" className={btn.primary}>הזמנה חדשה</Link>}>
        <div role="tablist" aria-label="האזור האישי" className="mt-6 -mx-4 px-4 md:mx-0 md:px-0 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(t => {
            const on = tab === t.id;
            return (
              <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={on} aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`shrink-0 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-[15px] font-bold border transition-colors ${on ? "bg-ink text-white border-ink" : "bg-white text-ink border-line hover:border-line-strong"}`}>
                <span className="md:hidden">{t.short}</span><span className="hidden md:inline">{t.label}</span>
                {t.count != null && (
                  <span className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[12px] leading-[22px] text-center ${on ? "bg-white/20 text-white" : "bg-soft text-muted"}`}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </PageTop>

      <div className={`${wrap} py-8 md:py-10`}>
        {/* Orders */}
        {tab === "orders" && (
          <div role="tabpanel" id="panel-orders" aria-labelledby="tab-orders" className="flex flex-col gap-6">
            {orders.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-5">
                  {orders.map(o => <OrderCard key={o.code} o={o} onMore={setModalOrder} />)}
                </div>
                <ValThorensInfo />
              </>
            ) : (
              <>
                <EmptyState title="עוד אין כאן הזמנות"
                  text="כשתזמינו חופשה היא תופיע כאן, עם התאריכים, מה כלול והתשלום."
                  action={<>
                    <Link href="/search?deal=full" className={btn.primary}>לחיפוש חבילה</Link>
                    <OpenChatButton className={btn.outline}><IcoChat />לכתוב לעוזר שלנו</OpenChatButton>
                  </>} />
                {/* link an order by its code — only while the account has none */}
                <div className={`${card} p-5 md:p-6 max-w-[560px] w-full mx-auto`}>
                  <CodeBox code={code} setCode={setCode} onSubmit={() => claim(code)} error={error}
                    label="הזמנתם בטלפון או בוואטסאפ? הזינו את קוד ההזמנה מהמייל" button="לחבר" />
                </div>
              </>
            )}
            <div className="grid lg:grid-cols-2 gap-5 items-start">
              <FAQBlock />
              <HelpCard wa={wa} />
            </div>
          </div>
        )}

        {/* Saved */}
        {tab === "saved" && (
          <div role="tabpanel" id="panel-saved" aria-labelledby="tab-saved">
            {saved.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {saved.map(s => <SavedCard key={s.id} s={s} onRemove={removeSaved} />)}
              </div>
            ) : (
              <EmptyState title="עוד לא שמרתם חופשות"
                text="מצאתם דירה שאהבתם? לחצו על הלב בדף הדירה, והיא תחכה לכם כאן."
                action={<Link href="/apartments" className={btn.primary}>לכל הדירות</Link>} />
            )}
          </div>
        )}

        {/* Account */}
        {tab === "account" && (
          <div role="tabpanel" id="panel-account" aria-labelledby="tab-account" className="max-w-[720px] flex flex-col gap-5">
            <section className={`${card} p-5 md:p-6 flex flex-wrap items-center gap-4`}>
              <span className="w-14 h-14 rounded-full bg-accent-soft text-accent font-display font-extrabold text-[20px] flex items-center justify-center shrink-0" aria-hidden="true">{initials || "?"}</span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[20px] text-ink truncate">{name}</div>
                <div className="text-[15px] text-muted truncate text-right" dir="ltr">{user!.email}</div>
              </div>
              {isAdmin && <Link href="/admin" className={btn.pill}>לאזור הניהול</Link>}
            </section>

            <section className={`${card} p-5 md:p-6 flex flex-wrap items-center justify-between gap-3`}>
              <div>
                <h2 className="font-bold text-[17px] text-ink">יציאה מהחשבון</h2>
                <p className="text-[15px] text-muted">ההזמנות נשארות שמורות, ואפשר להיכנס שוב בכל זמן.</p>
              </div>
              <button type="button" onClick={logout} className={btn.outline}><IcoOut />התנתקות</button>
            </section>

            {/* account deletion (App Store requirement) */}
            <section className="rounded-card border border-danger/30 bg-danger-soft/50 p-5 md:p-6 flex flex-col gap-3">
              <div>
                <h2 className="font-bold text-[17px] text-danger">מחיקת חשבון <span className="font-normal text-[14px] text-muted">· Delete account</span></h2>
                <p className="text-[15px] text-body mt-1">מוחקים את החשבון ואת כל הנתונים האישיים שלכם. אי אפשר לבטל את זה.</p>
              </div>
              <button type="button" onClick={deleteAccount}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-[14px] bg-danger hover:bg-[#912018] text-white font-bold text-[16px] transition-colors w-full sm:w-auto sm:self-start">
                <IcoTrash />למחוק את החשבון לצמיתות
              </button>
            </section>
          </div>
        )}
      </div>

      {modalOrder && <OrderModal o={modalOrder} onClose={() => setModalOrder(null)} />}
    </div>
  );
}

export default function MyPage() {
  return <Suspense fallback={<SkiLoader />}><MyOrder /></Suspense>;
}
