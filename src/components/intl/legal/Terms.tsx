import Link from "next/link";
import type { Lang } from "@/lib/intl/config";
import LegalPage, { H2, H3, UL } from "./LegalPage";

/*
 * A faithful translation of the parts of the Hebrew terms that apply to
 * booking an apartment: src/app/terms/page.tsx as of October 2026, with
 * clause 6.4 (clause numbers kept; left out are 3.2 passport, 3.7 ILS charge
 * (this site charges in euros) and 5 flights) and the apartment part of
 * src/app/emergency-policy/page.tsx (left out: the flight, ski pass and
 * on-holiday cards and the cancellation-insurance options, which this site
 * doesn't sell). Nothing is added. Clauses 9–13 (supply, refunds, the site,
 * privacy, contact) were added to the Hebrew terms in October 2026 (9.5 flights left out).
 */

const box = "my-2 rounded-2xl border border-accent/25 bg-accent-soft/60 p-4 md:p-5 flex flex-col gap-2";
const boxLink = "inline-flex items-center min-h-[44px]";

function TermsEn() {
  return (
    <LegalPage lang="en" title="Booking and cancellation terms" updated="October 2026"
      intro={<>This page translates the parts of SkiShare&apos;s booking terms (<a href="/terms" hrefLang="he">original in Hebrew</a>) that apply to booking an apartment, and the apartment part of our policy for emergencies, war and force majeure (<a href="/emergency-policy" hrefLang="he">original in Hebrew</a>). Clause numbers are those of the original.</>}>
      <H2>1. Introduction</H2>
      <p>1.1. We are sorry to hear that you wish to cancel your holiday, and we promise to be by your side at every stage of the process.</p>
      <p>1.2. You can contact us to cancel by WhatsApp or by email, and we will be happy to help you cancel and to arrange a future holiday.</p>
      <p>1.3. The website skisharebook.com is operated by Ski Share Ltd. (SkiShare), company no. 517332060, 12 HaZohar St., Caesarea, Israel (&quot;the company&quot;). The company rents holiday apartments and offers ski packages in Val Thorens, France: apartments, ski passes, airport transfers, ski equipment and flights.</p>
      <p>1.4. Booking and paying on the website require agreeing to these terms, by ticking the box for it before payment. These terms apply to every booking made on the website, through a quote sent to the customer, on WhatsApp or by phone.</p>

      <H2>2. Cancellation terms</H2>
      <p>2.1. Cancellation of the booking is subject to the Consumer Protection Law, 5741-1981 (Israel), and the Consumer Protection (Cancellation of Transaction) Regulations, 5771-2010.</p>
      <p>2.1.1. A booking made on the website, by phone or on WhatsApp may be cancelled within 14 days of being made, provided the cancellation is made more than 7 days (not counting rest days) before the service begins. In that case the payment is refunded less a cancellation fee of 5% of the transaction price or ILS 100, whichever is lower.</p>
      <p>2.2. Refund terms:</p>
      <UL>
        <li>From 14 days after the booking date until 15 days before the arrival date: a refund of 50% of the total transaction.</li>
        <li>Between 15 days and 8 days before the arrival date: a refund of 30% of the total transaction.</li>
        <li>From 8 days before the arrival date until the arrival date: no refund (0%).</li>
      </UL>
      <p>2.3. If the customer finds a replacement, they must notify the company and ensure a full handover.</p>

      <H2>3. General conditions</H2>
      <p>3.1. Cleaning: the apartment will be handed over to the customer clean. If it is returned in a condition that is not clean, a charge will be taken from the deposit.</p>
      <p>3.3. Insurance: the customer must hold insurance for all the days of the holiday, including winter sports and personal insurance.</p>
      <p>3.4. Credit card deposit: it will be collected a few days before entering the apartment, and will be managed by a third party responsible for cleaning and maintenance. If required, the third party may collect these expenses from the deposit immediately.</p>
      <p>3.5. Apartment keys: losing a key will result in a significant fine.</p>
      <p>3.6. Proper conduct: the customer must act in accordance with the rules of the place. The company is not responsible for the customers&apos; behaviour during the holiday.</p>
      <p>3.8. Booking confirmation: the booking will be confirmed only after full actual payment and its approval by the company.</p>

      <H2>4. Faults, discrepancies and irregularities at the accommodation</H2>
      <p>4.1. The accommodation is provided by external suppliers and is under their sole responsibility.</p>
      <p>4.2. The company will assist with the suppliers as far as possible, but is not directly responsible for maintenance, cleaning or facilities.</p>
      <p>4.3. Routine faults are not grounds for a refund, but will be dealt with through the supplier.</p>
      <p>4.4. In exceptional cases, the company will consider providing an alternative solution at its discretion.</p>
      <p>4.5. Any fault must be reported as soon as possible to the company&apos;s representatives on site or to the service centre.</p>

      <H2>6. Force majeure</H2>
      <p>6.1. The company will not be liable for delays, cancellations or disruption of services due to circumstances beyond its control (such as an epidemic, war, a strike or extreme weather).</p>
      <p>6.2. In the event of a cancellation due to force majeure, the company will look with the suppliers into the possibility of an alternative date or a credit voucher, but does not undertake to give a refund.</p>
      <p>6.3. Customers whose insurance includes a cancellation clause for force majeure will be referred to the insurance company.</p>
      <div className={box}>
        <p className="font-bold text-ink">6.4. Special clause: emergencies, war and closed airspace (as in the situation with Iran)</p>
        <p>In a security emergency, war, closure of the airspace or widespread flight cancellations, the company&apos;s extended cancellation policy, &quot;Emergencies, war and force majeure&quot;, also applies. The policy sets out what happens with flights, apartments and ski passes, what happens if you are already on holiday, and how it works with cancellation insurance. The policy is part of these terms.</p>
        <p className="flex flex-wrap gap-x-5">
          <a href="#emergency" className={boxLink}>Its apartment part, below&nbsp;<span aria-hidden="true">↓</span></a>
          <a href="/emergency-policy" hrefLang="he" className={boxLink}>The full policy, in Hebrew&nbsp;<span aria-hidden="true">→</span></a>
        </p>
      </div>

      <H2>7. Limitation of liability</H2>
      <p>7.1. The company provides intermediary, support and operating services for holiday packages, and is not the direct supplier of most of the services included in the package. The company&apos;s liability is limited to coordination and supervision with the relevant suppliers only.</p>
      <p>7.2. The company will bear no liability for any damage, loss or distress caused by:</p>
      <UL>
        <li>Failures, delays, disruptions or errors on the part of the service suppliers.</li>
        <li>Flight delays or flight cancellations by the airline.</li>
        <li>Exceptional weather conditions that prevent skiing or a planned activity.</li>
        <li>Delay or loss of luggage at the airport.</li>
        <li>Government decisions or restrictions (such as a lockdown or quarantine requirements).</li>
      </UL>
      <p>7.3. The company will do its best to help the customer in any exceptional case, but this is not an undertaking to pay financial compensation or to provide an alternative service, unless it has undertaken to do so in advance and in writing.</p>
      <p>7.4. The company will bear no liability for consequential, indirect or incidental damage, even if it could have been foreseen in advance.</p>
      <p>7.5. In any case, to the extent that the company&apos;s liability is established by law, this liability is limited to the amount actually paid by the customer for the package, and no more.</p>

      <H2>8. Information and photos</H2>
      <p>8.1. All the information published by the company is intended as a general illustration only.</p>
      <p>8.2. There may be differences between the information shown and the services actually provided on site.</p>
      <p>8.3. The company strives to show accurate information, but is not responsible for typing errors or inaccuracies that are not material.</p>
      <p>8.4. Minor changes (such as in colour, design, type of bed or location in the building) are not grounds for cancelling the transaction.</p>
      <p>8.5. In the event of a material change, the company will inform the customer in advance and offer a suitable alternative.</p>

      <H2>9. Supply of the service and delivery times</H2>
      <p>9.1. The company sells accommodation and holiday services, not physical goods. Nothing is shipped by post or courier; the service is provided in Val Thorens on the dates set in the booking.</p>
      <p>9.2. Once payment is received, the customer receives a booking confirmation by email, with the booking details, the dates and the amount paid.</p>
      <p>9.3. Before the arrival date (usually about a week before), the customer receives the arrival details for the apartment: the address, check-in and check-out times, and how to collect the key. Vouchers and pick-up details for any extra services booked (ski pass, transfer, equipment) are also sent before arrival.</p>
      <p>9.4. The apartment is at the customer&apos;s disposal from the arrival day to the departure day of the booking, according to the apartment&apos;s check-in and check-out times. Weekly apartments are rented Saturday to Saturday.</p>

      <H2>10. Service not provided and refunds</H2>
      <p>10.1. The customer will receive the service they booked and paid for. If the service was not provided for a reason within the company&apos;s control, and the customer did not accept an equivalent alternative, the customer will be refunded the full amount paid for that service.</p>
      <p>10.2. The refund is made to the means of payment used (for a credit card: a credit to the same card), within 14 days of the notice of cancellation or of the day it became clear the service would not be provided.</p>
      <p>10.3. In cases of force majeure, clause 6 applies, and in an emergency the emergency policy applies.</p>

      <H2>11. The company&apos;s responsibility for the website and its content</H2>
      <p>11.1. The company is responsible for the content it publishes on the website (the description of the apartments and services, the prices and the booking conditions) and for carrying out the bookings made on it in accordance with these terms.</p>
      <p>11.2. The binding price is the price shown to the customer when booking and paid by them. If there is an obvious error in a price or in the details of a service on the website, the company will inform the customer, who may choose to continue at the correct price or to cancel and receive a full refund.</p>
      <p>11.3. The company is not responsible for the content of external websites linked from the website, or for browsing disruptions caused by communication or hosting providers outside its control. The company will fix any fault on the website as soon as possible.</p>
      <p>11.4. Card payments are processed on a secure payment page of the payment company PayPlus. Card details are entered on that page only and are not stored by the company.</p>

      <H2>12. Privacy</H2>
      <p>12.1. The company protects its customers&apos; privacy. The details given when booking (name, phone, email and the travellers&apos; details) are used to carry out the booking, to communicate with the customer, and are passed only to the suppliers needed to provide the service (for example the apartment and the transfer company). They will not be passed to anyone else except as required by law.</p>
      <p>12.2. Marketing messages are sent only to those who agreed to receive them, and every message lets you unsubscribe.</p>
      <p>12.3. The full details: <Link href="/en/privacy">privacy policy</Link>.</p>

      <H2>13. Contact</H2>
      <p>13.1. For any question: phone <a href="tel:+972547701899" dir="ltr">+972 54-770-1899</a>, WhatsApp <a href="https://wa.me/972555174903" dir="ltr">+972 55-517-4903</a>, or email <a href="mailto:skishareteam@gmail.com">skishareteam@gmail.com</a>. Address: 12 HaZohar St., Caesarea, Israel.</p>

      <H2>14. Customer declaration</H2>
      <p>14.1. By approving this document, I confirm that I have read and understood the terms, and that all the clauses of the agreement have been brought to my attention.</p>
      <p>14.2. I approve the terms of my own free will and in accordance with the provisions of the Consumer Protection Law, 5741-1981 (Israel).</p>

      <H2 id="emergency">Emergencies, war and force majeure: apartments</H2>
      <H3>An important clarification about the nature of the service and the suppliers&apos; policies</H3>
      <p>A significant part of the holiday services is provided through external suppliers outside Israel, including airlines, apartment owners, equipment rental companies and ski pass suppliers. Accordingly, in cases of cancellation, change or an exceptional event, we are also subject to the cancellation and refund policies of those suppliers.</p>
      <p>In light of the events of the previous season, some suppliers have even updated and tightened their cancellation terms. That is why it is important to us to set out in advance, with full transparency, how we act in each case.</p>
      <H3>Apartments and accommodation: we help limit the loss</H3>
      <p>In most cases, once the booking has been made and confirmed with the apartment supplier, the payment is subject to the supplier&apos;s cancellation policy and is sometimes non-refundable.</p>
      <p>Where a refund cannot be obtained, we will make an effort to help reduce the loss. Among other things, we can help advertise the apartment in relevant groups and channels and try to find other guests who could use the booking.</p>
      <p>If a payment is received as a result of passing the booking on to other guests, the relevant amount will be passed on to the customer according to what was actually received.</p>
      <H3>In summary</H3>
      <p>We cannot control the decisions of airlines, apartment owners, ski resorts or the other suppliers outside Israel.</p>
      <p>What we can commit to is to act with full transparency, to keep you informed of any material information, to pass on to you any refund received on your behalf, and to help as much as possible to find solutions in the event of a change or an unforeseen event.</p>
      <p>Our goal is for you to know in advance exactly what the booking terms are, and that even in an exceptional situation you will have someone to deal with and to get help from.</p>
      <p>This policy supplements the regular terms and cancellation policy, and refers specifically to exceptional cases of war, mass flight cancellations or force majeure.</p>
    </LegalPage>
  );
}

function TermsFr() {
  return (
    <LegalPage lang="fr" title="Conditions de réservation et d'annulation" updated="octobre 2026"
      intro={<>Cette page traduit les parties des conditions de réservation de SkiShare (<a href="/terms" hrefLang="he">original en hébreu</a>) qui s&apos;appliquent à la réservation d&apos;un appartement, ainsi que la partie «&nbsp;appartements&nbsp;» de notre politique en cas d&apos;urgence, de guerre et de force majeure (<a href="/emergency-policy" hrefLang="he">original en hébreu</a>). La numérotation des clauses est celle de l&apos;original.</>}>
      <H2>1. Introduction</H2>
      <p>1.1. Nous sommes désolés d&apos;apprendre que vous souhaitez annuler vos vacances, et nous nous engageons à être à vos côtés à chaque étape de la procédure.</p>
      <p>1.2. Vous pouvez nous contacter pour annuler par WhatsApp ou par e-mail, et nous serons heureux de vous aider à effectuer l&apos;annulation et à organiser de futures vacances.</p>
      <p>1.3. Le site skisharebook.com est exploité par Ski Share Ltd. (SkiShare), société n°&nbsp;517332060, 12 rue HaZohar, Césarée, Israël (la «&nbsp;société&nbsp;»). La société loue des appartements de vacances et propose des séjours de ski à Val Thorens, en France&nbsp;: appartements, forfaits de ski, transferts depuis l&apos;aéroport, matériel de ski et vols.</p>
      <p>1.4. La réservation et le paiement sur le site supposent l&apos;acceptation des présentes conditions, en cochant la case prévue avant le paiement. Elles s&apos;appliquent à toute réservation faite sur le site, par un devis envoyé au client, sur WhatsApp ou par téléphone.</p>

      <H2>2. Conditions d&apos;annulation</H2>
      <p>2.1. L&apos;annulation de la réservation est soumise à la loi sur la protection du consommateur, 5741-1981 (Israël), et au règlement sur la protection du consommateur (annulation de transaction), 5771-2010.</p>
      <p>2.1.1. Une réservation faite sur le site, par téléphone ou sur WhatsApp peut être annulée dans les 14 jours suivant sa conclusion, à condition que l&apos;annulation intervienne plus de 7 jours (hors jours de repos) avant le début du service. Le paiement est alors remboursé, déduction faite de frais d&apos;annulation de 5&nbsp;% du prix de la transaction ou de 100&nbsp;ILS, le montant le plus bas étant retenu.</p>
      <p>2.2. Conditions de remboursement&nbsp;:</p>
      <UL>
        <li>À partir de 14 jours après la date de réservation et jusqu&apos;à 15 jours avant la date d&apos;arrivée&nbsp;: remboursement de 50&nbsp;% du montant total de la transaction.</li>
        <li>Entre 15 jours et 8 jours avant la date d&apos;arrivée&nbsp;: remboursement de 30&nbsp;% du montant total de la transaction.</li>
        <li>À partir de 8 jours avant la date d&apos;arrivée et jusqu&apos;à la date d&apos;arrivée&nbsp;: aucun remboursement (0&nbsp;%).</li>
      </UL>
      <p>2.3. Si le client trouve un remplaçant, il doit en informer la société et assurer une passation complète.</p>

      <H2>3. Conditions générales</H2>
      <p>3.1. Ménage&nbsp;: l&apos;appartement est remis propre au client. S&apos;il est rendu dans un état qui n&apos;est pas propre, un montant sera prélevé sur le dépôt de garantie.</p>
      <p>3.3. Assurance&nbsp;: le client doit être assuré pour toute la durée des vacances, y compris pour les sports d&apos;hiver, et disposer d&apos;une assurance individuelle.</p>
      <p>3.4. Dépôt de garantie par carte&nbsp;: il est prélevé quelques jours avant l&apos;entrée dans l&apos;appartement et géré par un tiers chargé du ménage et de l&apos;entretien. Si nécessaire, ce tiers peut prélever immédiatement ces frais sur le dépôt.</p>
      <p>3.5. Clés de l&apos;appartement&nbsp;: la perte d&apos;une clé entraîne une pénalité importante.</p>
      <p>3.6. Comportement approprié&nbsp;: le client doit respecter le règlement du lieu. La société n&apos;est pas responsable du comportement des clients pendant les vacances.</p>
      <p>3.8. Confirmation de la réservation&nbsp;: la réservation n&apos;est confirmée qu&apos;après le paiement intégral effectif et son acceptation par la société.</p>

      <H2>4. Pannes, non-conformités et anomalies dans les hébergements</H2>
      <p>4.1. Les hébergements sont fournis par des prestataires externes, sous leur seule responsabilité.</p>
      <p>4.2. La société apportera son aide auprès des prestataires dans la mesure du possible, mais n&apos;est pas directement responsable de l&apos;entretien, du ménage ou des équipements.</p>
      <p>4.3. Les pannes courantes ne donnent pas droit à un remboursement, mais seront traitées avec le prestataire.</p>
      <p>4.4. Dans des cas exceptionnels, la société examinera la possibilité d&apos;une solution de remplacement, à sa discrétion.</p>
      <p>4.5. Toute panne doit être signalée au plus vite aux représentants de la société sur place ou au service client.</p>

      <H2>6. Force majeure</H2>
      <p>6.1. La société ne pourra être tenue responsable des retards, annulations ou perturbations des services dus à des circonstances indépendantes de sa volonté (par exemple une épidémie, une guerre, une grève ou des conditions météorologiques extrêmes).</p>
      <p>6.2. En cas d&apos;annulation pour cause de force majeure, la société examinera avec les prestataires la possibilité d&apos;une date de remplacement ou d&apos;un avoir, mais ne s&apos;engage pas à un remboursement.</p>
      <p>6.3. Les clients dont l&apos;assurance comprend une clause d&apos;annulation pour force majeure seront orientés vers leur compagnie d&apos;assurance.</p>
      <div className={box}>
        <p className="font-bold text-ink">6.4. Clause spéciale&nbsp;: urgence, guerre et fermeture de l&apos;espace aérien (comme lors de la situation avec l&apos;Iran)</p>
        <p>En cas d&apos;urgence sécuritaire, de guerre, de fermeture de l&apos;espace aérien ou d&apos;annulations de vols à grande échelle, la politique d&apos;annulation étendue de la société, «&nbsp;Urgences, guerre et force majeure&nbsp;», s&apos;applique également. Cette politique précise ce qui se passe pour les vols, les appartements et les forfaits de ski, ce qui se passe si vous êtes déjà en vacances, et comment cela fonctionne avec l&apos;assurance annulation. Elle fait partie des présentes conditions.</p>
        <p className="flex flex-wrap gap-x-5">
          <a href="#emergency" className={boxLink}>Sa partie «&nbsp;appartements&nbsp;», ci-dessous&nbsp;<span aria-hidden="true">↓</span></a>
          <a href="/emergency-policy" hrefLang="he" className={boxLink}>La politique complète, en hébreu&nbsp;<span aria-hidden="true">→</span></a>
        </p>
      </div>

      <H2>7. Limitation de responsabilité</H2>
      <p>7.1. La société fournit des services d&apos;intermédiation, d&apos;accompagnement et d&apos;organisation de forfaits de vacances, et n&apos;est pas le prestataire direct de la plupart des services inclus dans le forfait. Sa responsabilité se limite à la coordination et au suivi auprès des prestataires concernés.</p>
      <p>7.2. La société décline toute responsabilité pour les dommages, pertes ou préjudices moraux causés par&nbsp;:</p>
      <UL>
        <li>Des manquements, retards, perturbations ou erreurs de la part des prestataires de services.</li>
        <li>Des retards ou des annulations de vols par la compagnie aérienne.</li>
        <li>Des conditions météorologiques exceptionnelles empêchant le ski ou une activité prévue.</li>
        <li>Le retard ou la perte de bagages à l&apos;aéroport.</li>
        <li>Des décisions ou restrictions gouvernementales (par exemple un confinement ou des obligations de quarantaine).</li>
      </UL>
      <p>7.3. La société fera tout son possible pour aider le client dans tout cas exceptionnel, sans que cela constitue un engagement à verser une compensation financière ou à fournir un service de remplacement, sauf si elle s&apos;y est engagée à l&apos;avance et par écrit.</p>
      <p>7.4. La société décline toute responsabilité pour les dommages consécutifs, indirects ou accessoires, même s&apos;ils étaient prévisibles.</p>
      <p>7.5. En tout état de cause, si la responsabilité de la société est établie conformément à la loi, elle est limitée au montant effectivement payé par le client pour le forfait, et pas au-delà.</p>

      <H2>8. Informations et photos</H2>
      <p>8.1. Toutes les informations publiées par la société ont une valeur d&apos;illustration générale uniquement.</p>
      <p>8.2. Des écarts peuvent exister entre les informations présentées et les services effectivement fournis sur place.</p>
      <p>8.3. La société s&apos;efforce de présenter des informations exactes, mais n&apos;est pas responsable des fautes de frappe ou des inexactitudes non substantielles.</p>
      <p>8.4. Les changements mineurs (par exemple de couleur, de décoration, de type de lit ou d&apos;emplacement dans l&apos;immeuble) ne constituent pas un motif d&apos;annulation de la transaction.</p>
      <p>8.5. En cas de changement substantiel, la société en informera le client à l&apos;avance et lui proposera une alternative adaptée.</p>

      <H2>9. Fourniture du service et délais</H2>
      <p>9.1. La société vend des services d&apos;hébergement et de vacances, et non des biens physiques. Rien n&apos;est expédié par la poste ou par coursier&nbsp;; le service est fourni à Val Thorens aux dates fixées dans la réservation.</p>
      <p>9.2. Dès réception du paiement, le client reçoit par e-mail une confirmation de réservation indiquant les détails de la réservation, les dates et le montant payé.</p>
      <p>9.3. Avant la date d&apos;arrivée (en général environ une semaine avant), le client reçoit les informations d&apos;arrivée&nbsp;: l&apos;adresse, les heures d&apos;arrivée et de départ et la façon de récupérer la clé. Les bons et informations de prise en charge des services supplémentaires réservés (forfait, transfert, matériel) sont également envoyés avant l&apos;arrivée.</p>
      <p>9.4. L&apos;appartement est à la disposition du client du jour d&apos;arrivée au jour de départ de la réservation, selon les heures d&apos;arrivée et de départ de l&apos;appartement. Les appartements à la semaine se louent du samedi au samedi.</p>

      <H2>10. Service non fourni et remboursement</H2>
      <p>10.1. Le client recevra le service qu&apos;il a réservé et payé. Si le service n&apos;a pas été fourni pour une raison qui dépend de la société, et que le client n&apos;a pas accepté une alternative équivalente, le montant intégral payé pour ce service lui sera remboursé.</p>
      <p>10.2. Le remboursement est effectué sur le moyen de paiement utilisé (pour une carte bancaire&nbsp;: un crédit sur la même carte), dans les 14 jours suivant l&apos;avis d&apos;annulation ou le jour où il est apparu que le service ne serait pas fourni.</p>
      <p>10.3. En cas de force majeure, la clause 6 s&apos;applique, et en situation d&apos;urgence, la politique d&apos;urgence s&apos;applique.</p>

      <H2>11. Responsabilité de la société pour le site et son contenu</H2>
      <p>11.1. La société est responsable du contenu qu&apos;elle publie sur le site (la description des appartements et des services, les prix et les conditions de réservation) et de l&apos;exécution des réservations qui y sont faites conformément aux présentes conditions.</p>
      <p>11.2. Le prix contractuel est celui affiché au client lors de la réservation et payé par lui. En cas d&apos;erreur manifeste de prix ou de description d&apos;un service sur le site, la société en informera le client, qui pourra choisir de poursuivre au prix correct ou d&apos;annuler et d&apos;être intégralement remboursé.</p>
      <p>11.3. La société n&apos;est pas responsable du contenu des sites externes vers lesquels renvoient des liens du site, ni des perturbations de navigation causées par des fournisseurs de communication ou d&apos;hébergement indépendants de sa volonté. La société corrigera au plus vite tout dysfonctionnement du site.</p>
      <p>11.4. Les paiements par carte sont traités sur une page de paiement sécurisée de la société de paiement PayPlus. Les données de carte sont saisies uniquement sur cette page et ne sont pas conservées par la société.</p>

      <H2>12. Confidentialité</H2>
      <p>12.1. La société protège la vie privée de ses clients. Les informations fournies lors de la réservation (nom, téléphone, e-mail et informations des voyageurs) servent à exécuter la réservation et à communiquer avec le client, et ne sont transmises qu&apos;aux prestataires nécessaires à la fourniture du service (par exemple l&apos;appartement et la société de transfert). Elles ne sont transmises à personne d&apos;autre, sauf obligation légale.</p>
      <p>12.2. Les messages commerciaux ne sont envoyés qu&apos;aux personnes qui y ont consenti, et chaque message permet de se désinscrire.</p>
      <p>12.3. Tous les détails&nbsp;: <Link href="/fr/privacy">politique de confidentialité</Link>.</p>

      <H2>13. Contact</H2>
      <p>13.1. Pour toute question&nbsp;: téléphone <a href="tel:+972547701899" dir="ltr">+972 54-770-1899</a>, WhatsApp <a href="https://wa.me/972555174903" dir="ltr">+972 55-517-4903</a>, ou e-mail <a href="mailto:skishareteam@gmail.com">skishareteam@gmail.com</a>. Adresse&nbsp;: 12 rue HaZohar, Césarée, Israël.</p>

      <H2>14. Déclaration du client</H2>
      <p>14.1. En acceptant ce document, je confirme avoir lu et compris les conditions, et que toutes les clauses du contrat ont été portées à ma connaissance.</p>
      <p>14.2. J&apos;accepte les conditions de mon plein gré et conformément aux dispositions de la loi sur la protection du consommateur, 5741-1981 (Israël).</p>

      <H2 id="emergency">Urgences, guerre et force majeure&nbsp;: appartements</H2>
      <H3>Précision importante sur la nature du service et les politiques des prestataires</H3>
      <p>Une part importante des services de vacances est fournie par des prestataires externes hors d&apos;Israël, notamment des compagnies aériennes, des propriétaires d&apos;appartements, des loueurs de matériel et des fournisseurs de forfaits de ski. Par conséquent, en cas d&apos;annulation, de modification ou d&apos;événement exceptionnel, nous sommes également soumis aux politiques d&apos;annulation et de remboursement de ces prestataires.</p>
      <p>À la suite des événements de la saison précédente, certains prestataires ont même mis à jour et durci leurs conditions d&apos;annulation. C&apos;est pourquoi il est important pour nous de présenter à l&apos;avance, en toute transparence, la façon dont nous agissons dans chaque cas.</p>
      <H3>Appartements et hébergement&nbsp;: nous aidons à limiter la perte</H3>
      <p>Dans la plupart des cas, une fois la réservation effectuée et confirmée auprès du fournisseur de l&apos;appartement, le paiement est soumis à la politique d&apos;annulation de ce fournisseur et n&apos;est parfois pas remboursable.</p>
      <p>Lorsqu&apos;aucun remboursement ne peut être obtenu, nous nous efforcerons d&apos;aider à réduire la perte. Nous pourrons notamment aider à diffuser l&apos;appartement dans des groupes et des canaux pertinents et essayer de trouver d&apos;autres voyageurs susceptibles d&apos;utiliser la réservation.</p>
      <p>Si un paiement est reçu grâce au transfert de la réservation à d&apos;autres voyageurs, le montant correspondant sera reversé au client selon ce qui a été effectivement reçu.</p>
      <H3>En résumé</H3>
      <p>Nous ne pouvons pas maîtriser les décisions des compagnies aériennes, des propriétaires d&apos;appartements, des stations de ski ou des autres prestataires hors d&apos;Israël.</p>
      <p>Ce à quoi nous pouvons nous engager, c&apos;est d&apos;agir en toute transparence, de vous tenir informés de toute information importante, de vous reverser tout remboursement reçu pour votre compte et de vous aider autant que possible à trouver des solutions en cas de changement ou d&apos;événement imprévu.</p>
      <p>Notre objectif est que vous connaissiez à l&apos;avance exactement les conditions de réservation et que, même dans une situation exceptionnelle, vous ayez un interlocuteur pour vous aider.</p>
      <p>Cette politique complète les conditions générales et la politique d&apos;annulation habituelle, et concerne spécifiquement les cas exceptionnels de guerre, d&apos;annulations massives de vols ou de force majeure.</p>
    </LegalPage>
  );
}

export default function Terms({ lang }: { lang: Lang }) {
  return lang === "fr" ? <TermsFr /> : <TermsEn />;
}
