"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconCalendar } from "@/components/Icons";
import { card, btn } from "@/components/ui";
import type { PricingRule } from "@/lib/pricing";
import { MAX_SEARCH_GUESTS, SEASON_END, cardFeeFor, type Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";
import { addDays, fmtDay, fmtDayRange, fmtEur } from "@/lib/intl/format";
import { quoteFor, type Week } from "@/lib/intl/pricing-view";
import { checkDates, firstBookable, parseSearch, searchQuery, type SearchState } from "@/lib/intl/search";
import DatesDialog from "../DatesDialog";
import Stepper from "../Stepper";
import CheckoutDialog from "./CheckoutDialog";

/*
 * The booking card of an apartment page (sticky beside the content on
 * desktop, after it on the phone, with a fixed price bar at the bottom of
 * the phone screen). The server renders it without dates (the price from the
 * season's lowest is in the HTML); the dates of the URL, and any new ones,
 * are priced here with the rules the server passed (lib/pricing.ts), checked
 * against /api/availability/blocked and written to the URL without a reload.
 */

export type PanelApartment = {
  id: string;
  orderName: string;            // the database name, for the order
  name: string;                 // the name in this language
  source: string | null;
  price_per_night: number;
  weeks: Week[];                // agency apartments: the free weeks ahead
  maxGuests: number;
};

type Avail = { key: string; state: "free" | "taken" | "error" };

export type PanelProps = {
  lang: Lang;
  todayIso: string;
  apt: PanelApartment;
  rules: PricingRule[];
  rulesOk: boolean;
  fromPrice: number | null;     // "from €X / night" (our own) or "/ week" (agency), from the server
};

/** The booking card for the dates and guests of the URL (?checkin&checkout&guests). */
export function BookingFromUrl(p: PanelProps) {
  const s = parseSearch(useSearchParams(), p.todayIso);
  return <BookingPanel {...p} initial={{ checkin: s.checkin, checkout: s.checkout, guests: s.guests, datesError: s.datesError }} />;
}

export default function BookingPanel({ lang, todayIso, apt, rules, rulesOk, fromPrice, initial }: PanelProps & {
  initial: Pick<SearchState, "checkin" | "checkout" | "guests" | "datesError">;
}) {
  const t = DICT[lang];
  const b = t.book;
  const agency = apt.source === "la_cime";
  const [checkin, setCheckin] = useState(initial.checkin);
  const [checkout, setCheckout] = useState(initial.checkout);
  const [guests, setGuests] = useState(initial.guests);
  const [datesError, setDatesError] = useState(initial.datesError);
  const [avail, setAvail] = useState<Avail | null>(null);
  const [showDates, setShowDates] = useState(false);
  const [showNights, setShowNights] = useState(false);
  const [paying, setPaying] = useState(false);

  const priceApt = { id: apt.id, source: apt.source, price_per_night: apt.price_per_night, available_weeks: apt.weeks };
  const quote = checkin && checkout && (agency || rulesOk) ? quoteFor(priceApt, rules, checkin, checkout, todayIso) : null;
  const stay = quote && quote.kind !== "noWeek" ? quote : null;
  const key = stay ? `${stay.checkin}|${stay.checkout}` : "";
  const known = !!key && avail?.key === key;
  const state = !key ? null : known ? avail!.state : "checking";
  const tooMany = guests > apt.maxGuests;
  const canBook = !!stay && state === "free" && !tooMany;

  // availability of the stay's dates, when the server didn't already tell
  const ci = stay?.checkin ?? "", co = stay?.checkout ?? "";
  useEffect(() => {
    if (!key || known) return;
    let cancelled = false;
    fetch(`/api/availability/blocked?checkin=${ci}&checkout=${co}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setAvail({ key, state: Array.isArray(d?.blocked) ? (d.blocked.includes(apt.id) ? "taken" : "free") : "error" });
      })
      .catch(() => { if (!cancelled) setAvail({ key, state: "error" }); });
    return () => { cancelled = true; };
  }, [key, known, ci, co, apt.id]);

  const writeUrl = (c1: string, c2: string, g: number) => {
    window.history.replaceState(null, "", `${window.location.pathname}${searchQuery({ checkin: c1, checkout: c2, guests: g })}`);
  };
  const setDates = (c1: string, c2: string) => {
    setDatesError(c1 && c2 ? checkDates(c1, c2, todayIso) : null);
    setCheckin(c1); setCheckout(c2);
    writeUrl(c1, c2, guests);
  };
  const changeGuests = (g: number) => { setGuests(g); writeUrl(checkin, checkout, g); };
  const toCard = () => document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const fee = stay ? cardFeeFor(stay.total) : 0;
  const nightsSum = stay && stay.kind === "nights" ? stay.total - stay.fee : 0;

  /* ── what the card says above the button ── */
  let note: { tone: "muted" | "warn" | "danger"; text: string } | null = null;
  if (datesError) note = { tone: "warn", text: datesError === "tooLong" ? t.dates.tooLong : t.dates.invalid };
  else if (!agency && !rulesOk) note = { tone: "warn", text: b.priceUnavailable };
  else if (!checkin || !checkout) note = { tone: "muted", text: agency ? b.chooseWeekPrompt : b.addDatesPrompt };
  else if (quote?.kind === "noWeek") note = { tone: "warn", text: b.agencyNoMatch };
  else if (state === "taken") note = { tone: "danger", text: b.taken };
  else if (state === "error") note = { tone: "warn", text: b.checkFailed };
  else if (tooMany) note = { tone: "warn", text: b.tooMany(apt.maxGuests) };
  else if (stay?.kind === "week" && stay.snapped) note = { tone: "muted", text: b.agencySnapped(fmtDayRange(stay.checkin, stay.checkout, lang)) };

  const mainAction = () => {
    if (canBook) return setPaying(true);
    if (state === "error") return setAvail(null); // check again
    if (agency) return toCard();
    setShowDates(true);
  };
  const mainLabel = canBook ? b.reserve
    : state === "checking" ? b.checking
    : agency ? b.chooseWeek
    : checkin && checkout ? b.changeDates : b.addDates;

  const head = stay
    ? { amount: fmtEur(stay.total, lang), unit: stay.kind === "week" ? t.common.fullWeek : t.common.forNights(stay.nights), prefix: "" }
    : fromPrice !== null && (agency || rulesOk)
      ? { amount: fmtEur(fromPrice, lang), unit: agency ? t.common.perWeek : t.common.perNight, prefix: t.common.from }
      : null;

  const line = (label: ReactNode, value: string, strong = false) => (
    <div className={`flex justify-between items-baseline gap-3 ${strong ? "text-[16px] font-bold text-ink" : "text-[15px]"}`}>
      <dt className={strong ? "" : "text-body"}>{label}</dt>
      <dd className={`shrink-0 ${strong ? "font-display text-[19px]" : "font-bold text-ink"}`}>{value}</dd>
    </div>
  );

  return (
    <>
      <section id="book" aria-label={b.aria} className="scroll-mt-[76px] md:scroll-mt-[96px] w-full lg:w-[390px] shrink-0 lg:sticky lg:top-[96px]">
        <div className={`${card} shadow-card p-5 flex flex-col gap-4`}>
          {/* the price */}
          <div className="flex items-baseline gap-1.5 flex-wrap min-h-[40px]">
            {head ? (
              <>
                {head.prefix && <span className="text-[15px] text-muted">{head.prefix}</span>}
                <span className="font-display font-extrabold text-[30px] leading-none text-ink">{head.amount}</span>
                <span className="text-[15px] text-muted">{head.unit}</span>
              </>
            ) : (
              <span className="font-display font-bold text-[20px] text-ink">{b.yourStay}</span>
            )}
          </div>

          {/* dates: the calendar (our own) or the free weeks (agency) */}
          {agency ? (
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-bold text-ink">{b.weeksLabel}</span>
              {apt.weeks.length ? (
                <ul className="flex flex-col gap-2 max-h-[300px] overflow-y-auto overscroll-contain pe-1">
                  {apt.weeks.map(w => {
                    const on = stay?.kind === "week" && stay.checkin === w.week;
                    return (
                      <li key={w.week}>
                        <button type="button" aria-pressed={on} onClick={() => setDates(w.week, addDays(w.week, 7))}
                          className={`w-full flex items-center justify-between gap-3 min-h-[48px] px-4 rounded-xl border text-[15px] text-start transition-colors ${
                            on ? "border-accent bg-accent-soft font-bold ring-1 ring-accent" : "border-line-strong hover:border-ink"}`}>
                          <span>{fmtDayRange(w.week, addDays(w.week, 7), lang)}</span>
                          <span className="font-bold">{fmtEur(w.price, lang)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[15px] text-muted">{b.noWeeks}</p>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => setShowDates(true)} aria-haspopup="dialog" aria-label={b.checkinOut}
              className="grid grid-cols-2 rounded-2xl border border-line-strong hover:border-ink overflow-hidden text-start transition-colors">
              {[{ l: t.dates.checkin, v: checkin }, { l: t.dates.checkout, v: checkout }].map((f, i) => (
                <span key={f.l} className={`flex flex-col px-4 py-2.5 min-h-[60px] justify-center ${i ? "border-s border-line-strong" : ""}`}>
                  <span className="text-[12px] font-bold text-muted uppercase tracking-wide">{f.l}</span>
                  <span className={`text-[15px] ${f.v && !datesError ? "font-bold text-ink" : "text-muted"}`}>
                    {f.v && !datesError ? fmtDay(f.v, lang) : t.dates.addDate}
                  </span>
                </span>
              ))}
            </button>
          )}

          {/* guests */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex flex-col">
              <span className="text-[15px] font-bold text-ink">{t.common.guestsLabel}</span>
              <span className="text-[13px] text-muted">{b.maxGuests(apt.maxGuests)}</span>
            </span>
            <Stepper lang={lang} value={guests} onChange={changeGuests} max={Math.max(apt.maxGuests, guests)} label={t.common.guestsLabel} />
          </div>

          {/* the price, line by line */}
          {stay && state !== "taken" && (
            <dl className="flex flex-col gap-2.5 border-t border-line pt-4">
              {stay.kind === "nights" ? (
                <>
                  {line(
                    <span className="flex flex-wrap items-center gap-x-2">
                      {b.nights(stay.nights)}
                      <button type="button" onClick={() => setShowNights(v => !v)} aria-expanded={showNights}
                        className={`${btn.link} text-[14px] min-h-[44px] -my-2`}>{showNights ? b.hideNights : b.showNights}</button>
                    </span>,
                    fmtEur(nightsSum, lang),
                  )}
                  {showNights && (
                    <div className="rounded-xl border border-line overflow-hidden text-[14px]">
                      <ul className="max-h-52 overflow-y-auto divide-y divide-line">
                        {stay.nightly.map(nt => (
                          <li key={nt.date} className="flex justify-between items-center px-3.5 py-2">
                            <span className="text-muted">{fmtDay(nt.date, lang)}</span>
                            <span className="font-bold text-ink">{fmtEur(nt.price, lang)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {stay.fee > 0 && line(b.cleaning, fmtEur(stay.fee, lang))}
                </>
              ) : (
                line(b.weekLine(fmtDayRange(stay.checkin, stay.checkout, lang)), fmtEur(stay.total, lang))
              )}
              {line(b.total, fmtEur(stay.total, lang), true)}
              {line(b.cardFee, fmtEur(fee, lang))}
              {line(b.totalByCard, fmtEur(stay.total + fee, lang), true)}
            </dl>
          )}

          {note && (
            <p role={note.tone === "muted" ? undefined : "alert"} className={`text-[15px] leading-relaxed ${
              note.tone === "danger" ? "text-danger font-bold" : note.tone === "warn" ? "text-warn font-bold" : "text-body"}`}>
              {note.text}
            </p>
          )}

          <button type="button" onClick={mainAction} disabled={state === "checking" || (agency && !apt.weeks.length) || (!agency && !rulesOk)}
            className={`${btn.primaryLg} w-full`}>
            {mainLabel}
          </button>

          <p className="text-[13px] text-muted leading-relaxed">
            {b.eurNote} {t.apt.gtkTerms} <Link href={`/${lang}/terms`} className="font-bold text-accent hover:text-accent-hover">{t.apt.gtkTermsLink}</Link>.
          </p>
        </div>
      </section>

      {/* ── phone: the price bar at the bottom ── */}
      <div className="h-[92px] lg:hidden" aria-hidden="true" />
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line px-4 pt-3 flex items-center gap-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))", boxShadow: "0 -8px 24px rgba(11,27,51,0.08)" }}>
        <div className="flex-1 min-w-0 leading-tight">
          {stay && state !== "taken" ? (
            <>
              <div className="font-display font-extrabold text-[22px] text-ink">{fmtEur(stay.total, lang)}</div>
              <div className="text-[13px] text-muted truncate">
                {stay.kind === "week" ? t.common.fullWeek : t.common.nights(stay.nights)} · {fmtDayRange(stay.checkin, stay.checkout, lang)}
              </div>
            </>
          ) : head ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-1">
                {head.prefix && <span className="text-[13px] text-muted">{head.prefix}</span>}
                <span className="font-display font-extrabold text-[22px] text-ink">{head.amount}</span>
                <span className="text-[13px] text-muted">{head.unit}</span>
              </div>
              <div className="text-[13px] text-muted truncate">{state === "taken" ? b.taken : agency ? t.common.satToSat : b.addDatesPrompt}</div>
            </>
          ) : (
            <div className="font-bold text-[15px] text-ink">{b.yourStay}</div>
          )}
        </div>
        <button type="button" onClick={mainAction} disabled={state === "checking"}
          className={`${btn.primary} px-5 shrink-0`}>
          {!canBook && !agency && !checkin ? <><IconCalendar size={18} /> {mainLabel}</> : mainLabel}
        </button>
      </div>

      {showDates && (
        <DatesDialog lang={lang} min={firstBookable(todayIso)} max={SEASON_END}
          checkin={datesError ? "" : checkin} checkout={datesError ? "" : checkout} guests={guests}
          maxGuests={Math.max(apt.maxGuests, 1) || MAX_SEARCH_GUESTS}
          onClose={() => setShowDates(false)}
          onApply={(c1, c2) => { setShowDates(false); setDates(c1, c2); }} />
      )}

      {paying && stay && (
        <CheckoutDialog lang={lang} onClose={() => setPaying(false)}
          onTaken={() => setAvail({ key, state: "taken" })}
          booking={{
            apartmentId: apt.id, orderName: apt.orderName, name: apt.name,
            checkin: stay.checkin, checkout: stay.checkout, nights: stay.nights, guests, total: stay.total,
          }} />
      )}
    </>
  );
}
