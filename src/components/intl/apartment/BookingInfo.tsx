import Link from "next/link";
import { Check } from "@/components/ui";
import { CONTACT_EMAIL, GUIDE_PAIRS, SEASON_END, SEASON_START, type Lang } from "@/lib/intl/config";

/*
 * Under the apartment on /en and /fr: everything a guest from abroad wants
 * to know before paying (who we are, how booking and payment work, what
 * happens on arrival, the cancellation refunds, emergencies), in plain
 * words, with the FAQ also as FAQPage JSON-LD. EN/FR visitors: no mention of where the company is based (Idan's call; the legal pages still say it). Every fact here is in the
 * booking terms (src/components/intl/legal/Terms.tsx, a translation of the
 * Hebrew terms) or elsewhere on the site; nothing is added. French: U+00A0
 * before : ; ? ! € %.
 */

const N = " ";
const guide = (lang: Lang, key: string) => {
  const p = GUIDE_PAIRS.find(g => g.key === key);
  return p ? `/${lang}/guide/${p[lang]}` : `/${lang}/guide`;
};
const dayFmt = (iso: string, lang: Lang) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

type Copy = {
  trustTitle: string;
  trust: { t: string; d: string }[];
  howTitle: string;
  how: string[];
  arriveTitle: string;
  arrive: string[];
  cancelTitle: string;
  cancelIntro: string;
  cancel: { when: string; refund: string }[];
  cancelNote: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  links: { terms: string; gettingThere: string; whereToStay: string; contact: string };
};

/** French spacing: a no-break space before : ; ? ! in every string. */
function frSpaces<T>(v: T): T {
  if (typeof v === "string") return v.replace(/ ([:;?!])/g, `${N}$1`) as T;
  if (Array.isArray(v)) return v.map(frSpaces) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, frSpaces(x)])) as T;
  return v;
}

function copy(lang: Lang, agency: boolean): Copy {
  const start = dayFmt(SEASON_START, lang), end = dayFmt(SEASON_END, lang);
  if (lang === "fr") return frSpaces<Copy>({
    trustTitle: "Réserver en toute confiance",
    trust: [
      { t: "Une vraie entreprise", d: `SkiShare est une société spécialisée dans les séjours au ski à Val Thorens, avec un site en français et en anglais. ${agency ? "Cet appartement est proposé par une agence partenaire, à la semaine." : "Cet appartement fait partie de nos propres appartements."}` },
      { t: "Paiement sécurisé", d: `Vous payez en ligne, par carte, en euros, via PayPlus (paiement sécurisé). Des frais de carte de 1,9${N}% s'ajoutent.` },
      { t: "Le prix de tout l'appartement", d: "Le prix affiché est celui de l'appartement entier pour vos dates, pas par personne. Vous le voyez avant de payer." },
      { t: "Des conditions claires", d: "Les remboursements en cas d'annulation sont écrits à l'avance, ci-dessous et dans nos conditions de réservation." },
    ],
    howTitle: "Comment se passe la réservation",
    how: [
      "Choisissez vos dates et le nombre de personnes : le prix exact s'affiche tout de suite.",
      "Indiquez votre nom, votre e-mail et votre téléphone, puis acceptez les conditions de réservation.",
      "Payez par carte sur la page sécurisée de PayPlus.",
      "La réservation est confirmée après le paiement complet et sa validation par SkiShare.",
    ],
    arriveTitle: "Avant d'arriver",
    arrive: [
      "Quelques jours avant l'arrivée, une caution est prise sur votre carte bancaire. Elle est gérée par le prestataire chargé du ménage et de l'entretien.",
      "L'appartement vous est remis propre. S'il est rendu sale, des frais sont retenus sur la caution.",
      "Une assurance est obligatoire pour tous les jours du séjour, sports d'hiver et assurance personnelle compris.",
      "La perte d'une clé entraîne une amende importante.",
      agency ? "Les appartements d'agence se louent à la semaine, du samedi au samedi." : `Les remontées mécaniques de Val Thorens sont ouvertes du ${start} au ${end}.`,
    ],
    cancelTitle: "Annulation et remboursement",
    cancelIntro: "Pour annuler, écrivez-nous par e-mail ou par WhatsApp. Le remboursement dépend de la date :",
    cancel: [
      { when: "De 14 jours après la réservation jusqu'à 15 jours avant l'arrivée", refund: `50${N}% du montant total` },
      { when: "Entre 15 et 8 jours avant l'arrivée", refund: `30${N}% du montant total` },
      { when: "Moins de 8 jours avant l'arrivée", refund: "Pas de remboursement" },
    ],
    cancelNote: "Si vous trouvez quelqu'un pour vous remplacer, prévenez-nous et nous ferons le changement. En cas de guerre, de fermeture de l'espace aérien ou de force majeure, nous vous aidons à limiter la perte et nous vous reversons tout remboursement obtenu pour vous.",
    faqTitle: "Questions avant de réserver",
    faq: [
      { q: "Qui est SkiShare ?", a: "SkiShare est une société qui loue des appartements à Val Thorens : ses propres appartements, et des appartements d'agence à la semaine. Le site est en français et en anglais, et le paiement se fait en ligne, en euros." },
      { q: "Le paiement est-il sécurisé ?", a: `Oui. Le paiement se fait par carte sur la page sécurisée de PayPlus, en euros. Des frais de carte de 1,9${N}% s'ajoutent au prix.` },
      { q: "Le prix est-il par personne ?", a: "Non. Le prix est celui de l'appartement entier pour vos dates, quel que soit le nombre de personnes (jusqu'au maximum de l'appartement)." },
      { q: "Quand ma réservation est-elle confirmée ?", a: "Après le paiement complet et sa validation par SkiShare." },
      { q: "Y a-t-il une caution ?", a: "Oui. Quelques jours avant l'arrivée, une caution est prise sur votre carte bancaire par le prestataire chargé du ménage et de l'entretien." },
      { q: "Puis-je annuler ?", a: `Oui, selon nos conditions : 50${N}% remboursés de 14 jours après la réservation jusqu'à 15 jours avant l'arrivée, 30${N}% entre 15 et 8 jours avant, et rien à moins de 8 jours.` },
      { q: "Comment aller à Val Thorens ?", a: "Les aéroports les plus proches sont Genève et Lyon, puis la route jusqu'à la station. Notre guide explique toutes les options." },
      { q: "Comment vous contacter ?", a: `Par e-mail, à ${CONTACT_EMAIL}.` },
    ],
    links: { terms: "Conditions de réservation", gettingThere: "Comment aller à Val Thorens", whereToStay: "Où loger à Val Thorens", contact: "Nous écrire" },
  });
  return {
    trustTitle: "Book with confidence",
    trust: [
      { t: "A real company", d: `SkiShare is a company specialising in ski holidays in Val Thorens, with a site in English and French. ${agency ? "This apartment is offered by a partner agency, by the week." : "This is one of our own apartments."}` },
      { t: "Secure payment", d: "You pay online by card, in euros, through PayPlus (secure payment). A 1.9% card fee is added." },
      { t: "The price of the whole apartment", d: "The price shown is for the whole apartment for your dates, not per person. You see it before you pay." },
      { t: "Clear terms", d: "The cancellation refunds are written down in advance, below and in our booking terms." },
    ],
    howTitle: "How booking works",
    how: [
      "Choose your dates and the number of guests: the exact price shows straight away.",
      "Enter your name, email and phone, and accept the booking terms.",
      "Pay by card on PayPlus's secure page.",
      "Your booking is confirmed once the full payment is made and approved by SkiShare.",
    ],
    arriveTitle: "Before you arrive",
    arrive: [
      "A few days before arrival, a deposit is taken on your credit card. It is managed by the company in charge of cleaning and maintenance.",
      "The apartment is handed over clean. If it is left dirty, a charge is taken from the deposit.",
      "Insurance is required for every day of the holiday, including winter sports and personal insurance.",
      "Losing a key means a significant fine.",
      agency ? "Agency apartments are rented by the week, Saturday to Saturday." : `The Val Thorens lifts are open from ${start} to ${end}.`,
    ],
    cancelTitle: "Cancellation and refunds",
    cancelIntro: "To cancel, write to us by email or WhatsApp. The refund depends on the date:",
    cancel: [
      { when: "From 14 days after booking until 15 days before arrival", refund: "50% of the total" },
      { when: "Between 15 and 8 days before arrival", refund: "30% of the total" },
      { when: "Less than 8 days before arrival", refund: "No refund" },
    ],
    cancelNote: "If you find someone to take your place, tell us and we will hand the booking over. In case of war, closed airspace or force majeure, we help limit your loss and pass on to you any refund we receive for you.",
    faqTitle: "Questions before booking",
    faq: [
      { q: "Who is SkiShare?", a: "SkiShare is a company renting apartments in Val Thorens: its own apartments, and agency apartments by the week. The site is in English and French, and you pay online, in euros." },
      { q: "Is the payment secure?", a: "Yes. You pay by card on PayPlus's secure page, in euros. A 1.9% card fee is added to the price." },
      { q: "Is the price per person?", a: "No. The price is for the whole apartment for your dates, whatever the number of guests (up to the apartment's maximum)." },
      { q: "When is my booking confirmed?", a: "Once the full payment is made and approved by SkiShare." },
      { q: "Is there a deposit?", a: "Yes. A few days before arrival, a deposit is taken on your credit card by the company in charge of cleaning and maintenance." },
      { q: "Can I cancel?", a: "Yes, under our terms: 50% back from 14 days after booking until 15 days before arrival, 30% between 15 and 8 days before, and nothing in the last 8 days." },
      { q: "How do I get to Val Thorens?", a: "The nearest airports are Geneva and Lyon, then the road up to the resort. Our guide explains every option." },
      { q: "How do I contact you?", a: `By email, at ${CONTACT_EMAIL}.` },
    ],
    links: { terms: "Booking terms", gettingThere: "How to get to Val Thorens", whereToStay: "Where to stay in Val Thorens", contact: "Write to us" },
  };
}

/** The FAQ as FAQPage JSON-LD (the same text as on the page). */
export function bookingFaqLd(lang: Lang, agency: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: copy(lang, agency).faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

const h = "font-display font-bold text-[21px] md:text-[23px] text-ink";
const li = "flex items-start gap-2";

export default function BookingInfo({ lang, agency }: { lang: Lang; agency: boolean }) {
  const c = copy(lang, agency);
  return (
    <>
      <section aria-labelledby="trust" className="flex flex-col gap-4">
        <h2 id="trust" className={h}>{c.trustTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {c.trust.map(x => (
            <div key={x.t} className="rounded-[18px] border border-line p-4 md:p-5 flex flex-col gap-1.5">
              <h3 className="flex items-center gap-2 font-bold text-[16px] md:text-[17px] text-ink"><Check />{x.t}</h3>
              <p className="text-[15px] leading-relaxed text-body">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="how" className="flex flex-col gap-3">
        <h2 id="how" className={h}>{c.howTitle}</h2>
        <ol className="flex flex-col gap-2.5">
          {c.how.map((s, i) => (
            <li key={s} className="flex items-start gap-3 text-[15px] md:text-[16px] leading-relaxed text-body">
              <span className="w-7 h-7 shrink-0 rounded-full bg-accent-soft text-accent font-bold text-[14px] flex items-center justify-center">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="arrive" className="flex flex-col gap-3">
        <h2 id="arrive" className={h}>{c.arriveTitle}</h2>
        <ul className="flex flex-col gap-2 text-[15px] md:text-[16px] leading-relaxed text-body">
          {c.arrive.map(s => <li key={s} className={li}><Check className="mt-[5px]" />{s}</li>)}
        </ul>
      </section>

      <section aria-labelledby="cancel" className="flex flex-col gap-3">
        <h2 id="cancel" className={h}>{c.cancelTitle}</h2>
        <p className="text-[15px] md:text-[16px] text-body">{c.cancelIntro}</p>
        <div className="rounded-[18px] border border-line overflow-hidden">
          <table className="w-full text-[15px]">
            <tbody>
              {c.cancel.map(r => (
                <tr key={r.when} className="border-b border-line last:border-0">
                  <td className="p-3 md:p-4 text-body">{r.when}</td>
                  <td className="p-3 md:p-4 font-bold text-ink whitespace-nowrap text-end">{r.refund}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[15px] leading-relaxed text-body">{c.cancelNote}</p>
      </section>

      <section aria-labelledby="faq" className="flex flex-col gap-3">
        <h2 id="faq" className={h}>{c.faqTitle}</h2>
        <div className="flex flex-col gap-2">
          {c.faq.map(f => (
            <details key={f.q} className="group rounded-[18px] border border-line bg-white open:bg-soft">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 p-4 font-bold text-[16px] text-ink min-h-[52px]">
                {f.q}<span className="text-muted transition-transform group-open:rotate-45 text-[20px] leading-none" aria-hidden="true">+</span>
              </summary>
              <p className="px-4 pb-4 -mt-1 text-[15px] leading-relaxed text-body">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
          <Link href={`/${lang}/terms`} className="inline-flex items-center min-h-[44px] font-bold text-accent hover:text-accent-hover">{c.links.terms}</Link>
          <Link href={guide(lang, "getting-there")} className="inline-flex items-center min-h-[44px] font-bold text-accent hover:text-accent-hover">{c.links.gettingThere}</Link>
          <Link href={guide(lang, "where-to-stay")} className="inline-flex items-center min-h-[44px] font-bold text-accent hover:text-accent-hover">{c.links.whereToStay}</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center min-h-[44px] font-bold text-accent hover:text-accent-hover">{c.links.contact}</a>
        </div>
      </section>
    </>
  );
}
