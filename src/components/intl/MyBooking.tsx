"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { btn, card, field, fieldLabel, Check, badgeLight, badgeDark } from "@/components/ui";
import { CONTACT_EMAIL, type Lang } from "@/lib/intl/config";
import { fmtDay, fmtDayRange, fmtEur } from "@/lib/intl/format";

/*
 * The personal area for customers from abroad (/en/my, /fr/my): what /my is in Hebrew,
 * opened from the English email ("Open my booking", ?code=…). The booking, what's included,
 * the photos, online check-in (then the address and how to get in), the flight check-in,
 * and how to reach us. Same APIs as /my: /api/orders/code/<code> and …/checkin.
 */

type FLeg = { date: string; time: string; no: string; arr?: string; airport?: string };
type Booking = {
  code: string; apartment_name: string; area: string;
  checkin: string | null; checkout: string | null; guests: number; nights: number;
  ski_pass: boolean; transfer: boolean; equipment?: boolean; flight?: boolean; pass3v?: boolean;
  flight_details?: string | null; transfer_details?: string | null; extra_apartment_name?: string | null;
  total_eur: number; status: string; customer_name: string;
  onlineCheckin?: { guests: string[]; arrival: string; phone: string; notes: string; at: string } | null;
  stay?: { address: string; ref: string; notes: string } | null;
  flightCheckin?: { airline: string; pnr: string; url: string; out: FLeg; ret: FLeg } | null;
  apartment?: { images?: string[] } | null;
  share_amount?: number | null;
};

const T = {
  en: {
    title: "My booking", sub: "Your ski holiday in Val Thorens, all in one place.",
    codeLabel: "Booking code (from your email)", open: "Open", notFound: "We couldn't find a booking with this code. Please check it, or email us.",
    status: { approved: "Confirmed", hold: "Awaiting confirmation", awaiting: "Awaiting confirmation", cancelled: "Cancelled" } as Record<string, string>,
    holdNote: "Your payment was received and the dates are held for you. We will confirm the booking shortly.",
    today: "Today!", tomorrow: "Tomorrow", inDays: (n: number) => `In ${n} days`,
    checkin: "Check-in", checkout: "Check-out", guests: "Guests", nights: "Nights", name: "Booked by",
    included: "Included", notIncluded: "Not included", inc: "Included",
    flight: "Flight", skiPass: "Val Thorens ski pass", skiPass3v: "3 Valleys ski pass", transfer: "Airport transfer", equipment: "Ski or snowboard rental",
    total: "Total", yourShare: "Your share", paid: "Paid", code: "Code",
    ci: { title: "Apartment check-in", text: "2 minutes, and you'll see the apartment address and how to get in right here.", start: "Start check-in",
      names: "Guests' names (as in the passport)", guest: (i: number) => `Guest ${i}`, arrival: "When will you arrive, roughly?", arrivalPh: "e.g. 17:30, or after landing in Lyon",
      phone: "Phone number for the arrival day", notes: "Anything we should know? (optional)", send: "Finish check-in", sending: "Sending…", cancel: "Cancel",
      need: "Please add at least one name and a phone number", error: "Something went wrong, please try again in a moment",
      done: "Apartment check-in done", address: "Address", map: "Map", ref: "Booking code at reception", later: "The apartment address and how to get in will appear here before you arrive." },
    fl: { title: "Flight check-in", out: "Outbound", ret: "Return", pnr: "Airline booking code", copy: "Copy", copied: "Copied", go: (a: string) => `Check in on the ${a} website`,
      note: "Online check-in usually opens 24 to 30 hours before the flight. We'll email you a reminder the day before each flight.", landing: (a: string, t: string) => ` · landing in ${a} ${t}` },
    help: "Need anything?", helpText: "A question about your booking, a change or a special request: write to us.", email: "Email us", whatsapp: "WhatsApp",
    faq: [
      { q: "When do we check in and out?", a: "Check-in from 4pm, check-out by 10am. We confirm the exact times with you before you arrive." },
      { q: "What should we bring?", a: "Thermal layers, gloves, ski goggles, sunscreen and a valid passport or ID. Ski equipment can be rented on the spot." },
      { q: "How do we get the keys?", a: "We send the access details a few days before you arrive, and they also appear here after the online check-in." },
      { q: "What if we need to cancel?", a: "The full cancellation policy is in our terms, and you can contact us at any time." },
    ],
    faqTitle: "Before the trip", terms: "Terms", home: "Back to the site",
  },
  fr: {
    title: "Ma réservation", sub: "Vos vacances au ski à Val Thorens, tout au même endroit.",
    codeLabel: "Code de réservation (dans votre e-mail)", open: "Ouvrir", notFound: "Aucune réservation trouvée avec ce code. Vérifiez-le, ou écrivez-nous.",
    status: { approved: "Confirmée", hold: "En attente de confirmation", awaiting: "En attente de confirmation", cancelled: "Annulée" } as Record<string, string>,
    holdNote: "Votre paiement a bien été reçu et les dates vous sont réservées. Nous confirmons la réservation très vite.",
    today: "Aujourd'hui !", tomorrow: "Demain", inDays: (n: number) => `Dans ${n} jours`,
    checkin: "Arrivée", checkout: "Départ", guests: "Voyageurs", nights: "Nuits", name: "Au nom de",
    included: "Inclus", notIncluded: "Non inclus", inc: "Inclus",
    flight: "Vol", skiPass: "Forfait Val Thorens", skiPass3v: "Forfait 3 Vallées", transfer: "Transfert aéroport", equipment: "Location de skis ou snowboard",
    total: "Total", yourShare: "Votre part", paid: "Payé", code: "Code",
    ci: { title: "Check-in de l'appartement", text: "2 minutes, et vous verrez ici l'adresse de l'appartement et comment y entrer.", start: "Faire le check-in",
      names: "Noms des voyageurs (comme sur le passeport)", guest: (i: number) => `Voyageur ${i}`, arrival: "Vers quelle heure arriverez-vous ?", arrivalPh: "ex. 17h30, ou après l'atterrissage à Lyon",
      phone: "Téléphone pour le jour de l'arrivée", notes: "Quelque chose à nous signaler ? (facultatif)", send: "Terminer le check-in", sending: "Envoi…", cancel: "Annuler",
      need: "Ajoutez au moins un nom et un numéro de téléphone", error: "Un problème est survenu, réessayez dans un instant",
      done: "Check-in de l'appartement effectué", address: "Adresse", map: "Carte", ref: "Code de réservation à l'accueil", later: "L'adresse de l'appartement et les informations d'accès apparaîtront ici avant votre arrivée." },
    fl: { title: "Enregistrement du vol", out: "Aller", ret: "Retour", pnr: "Code de réservation de la compagnie", copy: "Copier", copied: "Copié", go: (a: string) => `S'enregistrer sur le site ${a}`,
      note: "L'enregistrement en ligne ouvre en général 24 à 30 heures avant le vol. Nous vous envoyons un rappel la veille de chaque vol.", landing: (a: string, t: string) => ` · atterrissage à ${a} ${t}` },
    help: "Besoin d'aide ?", helpText: "Une question, un changement ou une demande particulière : écrivez-nous.", email: "Nous écrire", whatsapp: "WhatsApp",
    faq: [
      { q: "Quand arrive-t-on et quand part-on ?", a: "Arrivée à partir de 16h, départ avant 10h. Nous confirmons les horaires exacts avec vous avant l'arrivée." },
      { q: "Que faut-il apporter ?", a: "Sous-vêtements thermiques, gants, masque de ski, crème solaire et une pièce d'identité valide. Le matériel de ski se loue sur place." },
      { q: "Comment récupère-t-on les clés ?", a: "Nous envoyons les informations d'accès quelques jours avant l'arrivée ; elles apparaissent aussi ici après le check-in en ligne." },
      { q: "Et si nous devons annuler ?", a: "Les conditions d'annulation complètes sont dans nos conditions générales, et vous pouvez nous contacter à tout moment." },
    ],
    faqTitle: "Avant le voyage", terms: "Conditions générales", home: "Retour au site",
  },
};

const WA_NUMBER = "972555174903"; // the WhatsApp line in the English emails

const daysUntil = (s: string | null) => s ? Math.ceil((new Date(s + "T12:00:00").getTime() - Date.now()) / 86400000) : null;

function FlightBox({ f, lang }: { f: NonNullable<Booking["flightCheckin"]>; lang: Lang }) {
  const t = T[lang].fl;
  const [copied, setCopied] = useState(false);
  const leg = (label: string, l: FLeg) => l.date ? (
    <p className="text-[14px] text-body"><span className="font-bold text-ink">{label}:</span> {fmtDay(l.date, lang)}{l.time ? `, ${l.time}` : ""}{l.no ? ` · ${l.no}` : ""}{l.arr ? t.landing(l.airport === "LYS" ? "Lyon" : "Geneva", l.arr) : ""}</p>
  ) : null;
  return (
    <div className="rounded-2xl border border-line p-4 flex flex-col gap-3">
      <p className="font-bold text-[15px] text-ink">{t.title} · {f.airline}</p>
      <div className="flex flex-col gap-0.5">{leg(t.out, f.out)}{leg(t.ret, f.ret)}</div>
      {f.pnr && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-soft px-4 py-2.5">
          <span className="text-[14px] text-muted">{t.pnr}</span>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(f.pnr); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-2 font-mono font-bold text-[17px] text-ink">
            {f.pnr}<span className="text-[12px] font-sans font-bold text-accent">{copied ? t.copied : t.copy}</span>
          </button>
        </div>
      )}
      {f.url && <a href={f.url} target="_blank" rel="noopener noreferrer" className={`${btn.primary} w-full min-h-[44px]`}>{t.go(f.airline)}</a>}
      <p className="text-[13px] text-muted">{t.note}</p>
    </div>
  );
}

function CheckinBox({ b, lang, onDone }: { b: Booking; lang: Lang; onDone: (v: Partial<Booking>) => void }) {
  const t = T[lang].ci;
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<string[]>(() => {
    const given = String(b.customer_name || "").split(/\s*[,+&]\s*/).map(x => x.trim()).filter(Boolean);
    return Array.from({ length: Math.max(1, b.guests || 1, given.length) }, (_, i) => given[i] || "");
  });
  const [arrival, setArrival] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (b.status !== "approved" && b.status !== "hold") return null;

  const submit = async () => {
    setErr("");
    if (!names.some(n => n.trim()) || !phone.trim()) { setErr(t.need); return; }
    setBusy(true);
    const r = await fetch(`/api/orders/code/${encodeURIComponent(b.code)}/checkin`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests: names, arrival, phone, notes }),
    }).catch(() => null);
    setBusy(false);
    const j = r ? await r.json().catch(() => null) : null;
    if (!r?.ok || !j?.ok) { setErr(t.error); return; }
    onDone({ onlineCheckin: j.onlineCheckin, stay: j.stay });
    setOpen(false);
  };

  if (b.onlineCheckin) {
    return (
      <div className="rounded-2xl border border-ok/30 bg-ok-soft p-4 flex flex-col gap-2.5">
        <p className="flex items-center gap-2 font-bold text-[15px] text-ok-text"><Check size={16} />{t.done}</p>
        {b.stay ? (
          <div className="flex flex-col gap-2 text-[15px] text-ink">
            {b.stay.address && <p><span className="text-muted">{t.address}: </span><span className="font-bold">{b.stay.address}</span>{" "}
              <a className="text-accent font-bold underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.stay.address)}`}>{t.map}</a></p>}
            {b.stay.ref && <p><span className="text-muted">{t.ref}: </span><span className="font-mono font-bold">{b.stay.ref}</span></p>}
            {b.stay.notes && <p className="whitespace-pre-line text-body" dir="auto">{b.stay.notes}</p>}
          </div>
        ) : <p className="text-[14px] text-body">{t.later}</p>}
      </div>
    );
  }
  if (!open) {
    return (
      <div className="rounded-2xl border border-line p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <p className="font-bold text-[15px] text-ink">{t.title}</p>
          <p className="text-[14px] text-body">{t.text}</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={`${btn.primary} shrink-0 min-h-[44px] px-5`}>{t.start}</button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line p-4 flex flex-col gap-3">
      <p className="font-bold text-[16px] text-ink">{t.title}</p>
      <div className="flex flex-col gap-2">
        <span className={fieldLabel}>{t.names}</span>
        {names.map((n, i) => (
          <input key={i} value={n} onChange={e => setNames(v => v.map((x, j) => j === i ? e.target.value : x))}
            placeholder={t.guest(i + 1)} className={field} autoComplete={i === 0 ? "name" : "off"} />
        ))}
      </div>
      <label className="flex flex-col gap-1.5"><span className={fieldLabel}>{t.arrival}</span>
        <input value={arrival} onChange={e => setArrival(e.target.value)} placeholder={t.arrivalPh} className={field} /></label>
      <label className="flex flex-col gap-1.5"><span className={fieldLabel}>{t.phone}</span>
        <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+33 6 00 00 00 00" className={field} /></label>
      <label className="flex flex-col gap-1.5"><span className={fieldLabel}>{t.notes}</span>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${field} py-2.5`} /></label>
      {err && <p role="alert" className="text-[14px] text-danger">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={busy} className={`${btn.primary} flex-1 min-h-[44px]`}>{busy ? t.sending : t.send}</button>
        <button type="button" onClick={() => setOpen(false)} className={`${btn.outline} min-h-[44px] px-4`}>{t.cancel}</button>
      </div>
    </div>
  );
}

function BookingView({ b: initial, lang }: { b: Booking; lang: Lang }) {
  const t = T[lang];
  const [b, setB] = useState(initial);
  const imgs = b.apartment?.images?.length ? b.apartment.images : ["/view.jpg"];
  const [pic, setPic] = useState(0);
  const d = daysUntil(b.checkin);
  const addons = [
    { label: t.flight, on: !!b.flight, detail: b.flight_details || "" },
    { label: b.pass3v ? t.skiPass3v : t.skiPass, on: !!b.ski_pass, detail: "" },
    { label: t.transfer, on: !!b.transfer, detail: b.transfer_details || "" },
    { label: t.equipment, on: !!b.equipment, detail: "" },
  ].filter(a => a.on);
  const subject = encodeURIComponent(`Booking ${b.code.toUpperCase()}`);
  return (
    <div className="flex flex-col gap-6">
      <article className={`${card} overflow-hidden`}>
        <div className="relative h-56 md:h-80 bg-soft-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[pic] ?? imgs[0]} alt={b.apartment_name} className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute top-3.5 start-3.5"><span className={badgeLight}>{t.status[b.status] ?? t.status.awaiting}</span></span>
          {d != null && d >= 0 && <span className={`absolute bottom-3.5 start-3.5 ${badgeDark}`}>{d === 0 ? t.today : d === 1 ? t.tomorrow : t.inDays(d)}</span>}
          {imgs.length > 1 && <span className="absolute bottom-3.5 end-3.5 rounded-full bg-ink/70 text-white text-[12px] font-bold px-2.5 py-1">{pic + 1}/{imgs.length}</span>}
        </div>
        {imgs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-5 pt-4 pb-1">
            {imgs.map((u, i) => (
              <button key={u + i} type="button" onClick={() => setPic(i)} aria-label={`Photo ${i + 1}`}
                className={`shrink-0 w-[72px] h-[54px] rounded-lg overflow-hidden border-2 ${i === pic ? "border-ink" : "border-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="p-5 md:p-6 flex flex-col gap-5">
          <div>
            <h2 className="font-display font-bold text-[24px] text-ink" dir="auto">{b.apartment_name}{b.extra_apartment_name ? ` + ${b.extra_apartment_name}` : ""}</h2>
            <p className="text-[15px] text-muted">{b.area || "Val Thorens"}{b.checkin && b.checkout ? ` · ${fmtDayRange(b.checkin, b.checkout, lang, true)}` : ""}</p>
          </div>
          {b.status === "hold" && <p className="text-[15px] text-body">{t.holdNote}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            {[[t.checkin, b.checkin ? fmtDay(b.checkin, lang, true) : "—"], [t.checkout, b.checkout ? fmtDay(b.checkout, lang, true) : "—"], [t.guests, String(b.guests)], [t.nights, String(b.nights)]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-soft px-4 py-3"><p className="text-[13px] text-muted mb-0.5">{k}</p><p className="font-bold text-[15px] text-ink">{v}</p></div>
            ))}
          </div>
          {b.customer_name && <div className="rounded-xl bg-soft px-4 py-3"><p className="text-[13px] text-muted mb-0.5">{t.name}</p><p className="font-bold text-[15px] text-ink" dir="auto">{b.customer_name}</p></div>}
          {addons.length > 0 && (
            <div>
              <p className="font-bold text-[15px] text-ink mb-2">{t.included}</p>
              <div className="flex flex-col gap-2">
                {addons.map(a => (
                  <div key={a.label} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-2.5 min-h-[48px]">
                    <span className="min-w-0"><span className="block text-[15px] text-ink font-bold">{a.label}</span>{a.detail && <span className="block text-[13px] text-body mt-0.5" dir="auto">{a.detail}</span>}</span>
                    <span className="shrink-0 flex items-center gap-1.5 text-[14px] font-bold text-ok-text"><Check size={15} />{t.inc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {b.flightCheckin && (b.status === "approved" || b.status === "hold") && <FlightBox f={b.flightCheckin} lang={lang} />}
          <CheckinBox b={b} lang={lang} onDone={v => setB(x => ({ ...x, ...v }))} />
          <div className="flex items-center justify-between rounded-2xl bg-soft px-4 py-4">
            <span className="text-[15px] font-bold text-ink">{b.share_amount ? t.yourShare : t.total}</span>
            <span className="font-display font-extrabold text-[26px] text-ink">{fmtEur(b.share_amount || b.total_eur, lang)}</span>
          </div>
          <p className="text-center text-[13px] text-muted">{t.code}: <span className="font-mono">{b.code.toUpperCase()}</span>{b.status === "approved" ? <> · <span className="font-bold text-ok-text">{t.paid}</span></> : null}</p>
        </div>
      </article>

      <section className={`${card} p-5 md:p-6`}>
        <h2 className="font-display font-bold text-[21px] text-ink mb-2">{t.faqTitle}</h2>
        {t.faq.map((f, i) => (
          <details key={f.q} className={`group py-1 ${i > 0 ? "border-t border-line" : ""}`}>
            <summary className="list-none cursor-pointer flex items-center justify-between gap-4 min-h-[52px] font-bold text-[16px] text-ink">
              {f.q}<span aria-hidden="true" className="text-muted text-xl transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="pb-4 text-[15px] leading-relaxed text-body">{f.a}{i === 3 && <> <Link href={`/${lang}/terms`} className="font-bold text-accent">{t.terms}</Link></>}</p>
          </details>
        ))}
      </section>

      <section className="rounded-card bg-ink text-white p-5 md:p-6 flex flex-col gap-4">
        <div>
          <h2 className="font-display font-bold text-[21px]">{t.help}</h2>
          <p className="text-[15px] text-[#D6DEEA] mt-1">{t.helpText}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          <a href={`mailto:${CONTACT_EMAIL}?subject=${subject}`} className="inline-flex items-center justify-center min-h-[48px] rounded-[14px] bg-white text-ink font-bold text-[16px]">{t.email}</a>
          <a href={`https://wa.me/${WA_NUMBER}?text=${subject}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center min-h-[48px] rounded-[14px] border border-white/45 text-white font-bold text-[16px]">{t.whatsapp}</a>
        </div>
      </section>
    </div>
  );
}

export default function MyBooking({ lang }: { lang: Lang }) {
  const t = T[lang];
  const params = useSearchParams();
  const urlCode = params.get("code") || "";
  const [code, setCode] = useState(urlCode);
  const [b, setB] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!urlCode);

  const fetchBooking = (c: string) => fetch(`/api/orders/code/${encodeURIComponent(c.trim().toLowerCase())}`)
    .then(r => r.ok ? r.json() as Promise<Booking> : null).catch(() => null);

  const lookup = async (c: string) => {
    if (!c.trim()) return;
    setError(""); setLoading(true);
    const found = await fetchBooking(c);
    if (found) setB(found); else setError(t.notFound);
    setLoading(false);
  };
  // the code from the email link (?code=…) opens the booking right away
  useEffect(() => {
    if (!urlCode) return;
    let live = true;
    fetchBooking(urlCode).then(found => {
      if (!live) return;
      if (found) setB(found); else setError(T[lang].notFound);
      setLoading(false);
    });
    return () => { live = false; };
  }, [urlCode, lang]);

  return (
    <div className="flex-1 bg-soft">
      <div className="w-full max-w-[760px] mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-extrabold text-[30px] md:text-[38px] leading-tight text-ink">{t.title}</h1>
          <p className="text-[16px] text-muted mt-1">{t.sub}</p>
        </div>
        {loading ? (
          <div className={`${card} h-64 animate-pulse`} />
        ) : b ? (
          <BookingView b={b} lang={lang} />
        ) : (
          <form onSubmit={e => { e.preventDefault(); lookup(code); }} className={`${card} p-5 md:p-6 flex flex-col gap-2`}>
            <label htmlFor="booking-code" className={fieldLabel}>{t.codeLabel}</label>
            <div className="flex gap-2">
              <input id="booking-code" value={code} onChange={e => setCode(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false}
                placeholder="K7M2PQ" className={`${field} flex-1 min-w-0 text-center font-mono tracking-wider`} />
              <button type="submit" className={`${btn.dark} shrink-0 px-5`}>{t.open}</button>
            </div>
            {error && <p role="alert" className="text-[14px] text-danger">{error}</p>}
            <Link href={`/${lang}`} className="text-[14px] font-bold text-accent mt-2">{t.home}</Link>
          </form>
        )}
      </div>
    </div>
  );
}
