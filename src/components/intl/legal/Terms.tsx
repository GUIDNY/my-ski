import type { Lang } from "@/lib/intl/config";
import LegalPage, { H2, H3, UL } from "./LegalPage";

/*
 * A faithful translation of the parts of the Hebrew terms that apply to
 * booking an apartment: src/app/terms/page.tsx (clause numbers kept; left out
 * are 3.2 passport, 3.7 ILS charge (this site charges in euros) and 5 flights)
 * and the apartment part of src/app/emergency-policy/page.tsx (left out: the
 * flight, ski pass and on-holiday cards and the cancellation-insurance
 * options, which this site doesn't sell). Nothing is added.
 */

function TermsEn() {
  return (
    <LegalPage lang="en" title="Booking and cancellation terms" updated="June 2026"
      intro={<>This page translates the parts of SkiShare&apos;s booking terms (<a href="/terms" hrefLang="he">original in Hebrew</a>) that apply to booking an apartment, and the apartment part of our policy for emergencies, war and force majeure (<a href="/emergency-policy" hrefLang="he">original in Hebrew</a>). Clause numbers are those of the original.</>}>
      <H2>1. Introduction</H2>
      <p>1.1. We are sorry to hear that you wish to cancel your holiday, and we promise to be by your side at every stage of the process.</p>
      <p>1.2. You can contact us to cancel by WhatsApp or by email, and we will be happy to help you cancel and to arrange a future holiday.</p>

      <H2>2. Cancellation terms</H2>
      <p>2.1. Cancellation of the booking is subject to the Consumer Protection Law (Israel).</p>
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

      <H2>9. Customer declaration</H2>
      <p>9.1. By approving this document, I confirm that I have read and understood the terms, and that all the clauses of the agreement have been brought to my attention.</p>
      <p>9.2. I approve the terms of my own free will and in accordance with the provisions of the Consumer Protection Law, 5741-1981 (Israel).</p>

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
    <LegalPage lang="fr" title="Conditions de réservation et d'annulation" updated="juin 2026"
      intro={<>Cette page traduit les parties des conditions de réservation de SkiShare (<a href="/terms" hrefLang="he">original en hébreu</a>) qui s&apos;appliquent à la réservation d&apos;un appartement, ainsi que la partie «&nbsp;appartements&nbsp;» de notre politique en cas d&apos;urgence, de guerre et de force majeure (<a href="/emergency-policy" hrefLang="he">original en hébreu</a>). La numérotation des clauses est celle de l&apos;original.</>}>
      <H2>1. Introduction</H2>
      <p>1.1. Nous sommes désolés d&apos;apprendre que vous souhaitez annuler vos vacances, et nous nous engageons à être à vos côtés à chaque étape de la procédure.</p>
      <p>1.2. Vous pouvez nous contacter pour annuler par WhatsApp ou par e-mail, et nous serons heureux de vous aider à effectuer l&apos;annulation et à organiser de futures vacances.</p>

      <H2>2. Conditions d&apos;annulation</H2>
      <p>2.1. L&apos;annulation de la réservation est soumise à la loi sur la protection du consommateur (Israël).</p>
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

      <H2>9. Déclaration du client</H2>
      <p>9.1. En acceptant ce document, je confirme avoir lu et compris les conditions, et que toutes les clauses du contrat ont été portées à ma connaissance.</p>
      <p>9.2. J&apos;accepte les conditions de mon plein gré et conformément aux dispositions de la loi sur la protection du consommateur, 5741-1981 (Israël).</p>

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
