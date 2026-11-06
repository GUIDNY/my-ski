import type { Lang } from "@/lib/intl/config";
import LegalPage, { H2, H3, UL } from "./LegalPage";

/* A faithful translation of src/app/privacy/page.tsx, with the cookie policy
   (src/app/cookies/page.tsx) as its section 5. Nothing is added. */

function PrivacyEn() {
  return (
    <LegalPage lang="en" title="Privacy and cookies" updated="November 2026"
      intro={<>This page translates our privacy policy (<a href="/privacy" hrefLang="he">original in Hebrew</a>) and our cookie policy (<a href="/cookies" hrefLang="he">original in Hebrew</a>).</>}>
      <p>Ski Share Ltd. (the &quot;Company&quot; / &quot;SkiShare&quot;) respects your privacy. This policy explains what information is collected when you use the <b>skisharebook.com</b> site, how it is stored and to whom it may be passed, in accordance with the Protection of Privacy Law, 5741-1981 (Israel).</p>

      <H2>1. What information we collect</H2>
      <UL>
        <li><b>Details you provide:</b> name, phone, email, dates of stay, number of guests and booking details.</li>
        <li><b>Payment details:</b> processed directly by the payment provider PayPlus. We do <u>not</u> store credit card numbers on the site&apos;s servers.</li>
        <li><b>Technical information:</b> IP address, browser and device type, and anonymous usage data for running and improving the site.</li>
        <li><b>Cookies:</b> see section 5.</li>
      </UL>

      <H2>2. Why we use the information</H2>
      <UL>
        <li>Handling bookings, contacting you and providing customer service.</li>
        <li>Carrying out and processing payments.</li>
        <li>Improving the user experience and the proper running of the site.</li>
        <li>Meeting legal and regulatory requirements.</li>
      </UL>

      <H2>3. Passing information to third parties</H2>
      <p>We do not sell personal information. Information may be passed only to service providers needed for operation:</p>
      <UL>
        <li><b>PayPlus</b>: payment processing.</li>
        <li><b>Supabase / Vercel</b>: hosting, database and the site&apos;s infrastructure.</li>
        <li>Accommodation, transfer and flight providers: only to carry out the booking.</li>
        <li>Competent authorities: as required by law.</li>
      </UL>

      <H2>4. Information security</H2>
      <p>The site is secured with an SSL certificate (HTTPS) and access to the information is restricted. However, absolute security cannot be guaranteed, and we use reasonable and accepted means to protect the information.</p>

      <H2 id="cookies">5. Cookies</H2>
      <p>The site uses cookies that are essential for running it and for improving the experience (for example, saving preferences). You can block cookies in your browser settings, but this may affect some of the functions.</p>
      <p>Our cookie policy explains how the <b>SkiShare</b> site and app (skisharebook.com) use cookies. We protect your privacy: besides the cookies the site needs to work, we use <b>only two third-party measurement tools: the OpenAI measurement pixel</b>, to know whether our ads on ChatGPT brought enquiries and bookings, <b>and Vercel Web Analytics</b>, for overall visit counts. On the English and French pages they only load after you accept cookies.</p>
      <H3>What cookies are</H3>
      <p>Cookies are small text files saved on your device when you use the site, which allow basic services such as signing in to an account to work properly.</p>
      <H3>Which cookies we use</H3>
      <UL>
        <li><b>Essential cookies (first party only):</b> needed for the site to work: keeping the session and secure sign-in to an account. Without them you cannot sign in or manage a booking.</li>
        <li><b>Preferences:</b> saving your agreement to the cookie policy, so that you are not asked again.</li>
        <li><b>Ad measurement (third party, OpenAI):</b> the OpenAI Ads measurement pixel records page views, an enquiry (a WhatsApp click, a message in the site chat or a quote link), going to payment and a completed booking (the booking code and amount). We do not send it your name, phone, email or payment details. OpenAI uses this to attribute actions on the site to our ads, under its own privacy policy. It does not run in the staff areas.</li>
        <li><b>Visit statistics (third party, Vercel):</b> Vercel Web Analytics counts page visits, the referring site, country and device type, in aggregate. It sets no cookies in your browser and does not identify you personally.</li>
      </UL>
      <H3>What we do <u>not</u> use</H3>
      <UL>
        <li><b>No remarketing:</b> we do not use cookies to follow you with ads on other sites, and there are no ads on our site.</li>
        <li><b>No other tools:</b> no Google Analytics, no Facebook Pixel and no external analytics tools other than the OpenAI measurement pixel and Vercel Web Analytics described above.</li>
        <li><b>No sharing with data brokers:</b> we do not share your data or link it with third-party data for marketing or advertising purposes.</li>
      </UL>
      <H3>Payments</H3>
      <p>Payments are processed directly by the payment provider <b>PayPlus</b> on a secure page. We do not store credit card details on the site&apos;s servers.</p>
      <H3>Managing cookies</H3>
      <p>You can block or delete cookies in your browser or device settings. Blocking essential cookies may affect your ability to sign in and to use some of the services.</p>

      <H2>6. Your rights</H2>
      <p>Under the law, you may review the information collected about you and ask for it to be corrected or deleted. To contact us: <a href="mailto:skishareteam@gmail.com">skishareteam@gmail.com</a>.</p>

      <H2>7. Changes</H2>
      <p>The Company may update this policy from time to time. The updated version will be published on this page.</p>
    </LegalPage>
  );
}

function PrivacyFr() {
  return (
    <LegalPage lang="fr" title="Confidentialité et cookies" updated="novembre 2026"
      intro={<>Cette page traduit notre politique de confidentialité (<a href="/privacy" hrefLang="he">original en hébreu</a>) et notre politique relative aux cookies (<a href="/cookies" hrefLang="he">original en hébreu</a>).</>}>
      <p>Ski Share Ltd. (ci-après la «&nbsp;Société&nbsp;» ou «&nbsp;SkiShare&nbsp;») respecte votre vie privée. Cette politique explique quelles informations sont collectées lors de l&apos;utilisation du site <b>skisharebook.com</b>, comment elles sont conservées et à qui elles peuvent être transmises, conformément à la loi sur la protection de la vie privée, 5741-1981 (Israël).</p>

      <H2>1. Les informations que nous collectons</H2>
      <UL>
        <li><b>Les informations que vous fournissez&nbsp;:</b> nom, téléphone, e-mail, dates de séjour, nombre de voyageurs et détails de la réservation.</li>
        <li><b>Les données de paiement&nbsp;:</b> traitées directement par le prestataire de paiement PayPlus. Nous ne conservons <u>pas</u> de numéros de carte bancaire sur les serveurs du site.</li>
        <li><b>Les informations techniques&nbsp;:</b> adresse IP, type de navigateur et d&apos;appareil, et données d&apos;utilisation anonymes, pour le fonctionnement et l&apos;amélioration du site.</li>
        <li><b>Les cookies&nbsp;:</b> voir la section 5.</li>
      </UL>

      <H2>2. Pourquoi nous utilisons ces informations</H2>
      <UL>
        <li>Traiter les réservations, vous contacter et assurer le service client.</li>
        <li>Effectuer et traiter les paiements.</li>
        <li>Améliorer l&apos;expérience utilisateur et assurer le bon fonctionnement du site.</li>
        <li>Respecter les obligations légales et réglementaires.</li>
      </UL>

      <H2>3. Transmission d&apos;informations à des tiers</H2>
      <p>Nous ne vendons pas d&apos;informations personnelles. Des informations peuvent être transmises uniquement aux prestataires nécessaires au fonctionnement&nbsp;:</p>
      <UL>
        <li><b>PayPlus</b>&nbsp;: traitement des paiements.</li>
        <li><b>Supabase / Vercel</b>&nbsp;: hébergement, base de données et infrastructure du site.</li>
        <li>Les prestataires d&apos;hébergement, de transferts et de vols&nbsp;: uniquement pour exécuter la réservation.</li>
        <li>Les autorités compétentes&nbsp;: dans la mesure requise par la loi.</li>
      </UL>

      <H2>4. Sécurité des informations</H2>
      <p>Le site est sécurisé par un certificat SSL (HTTPS) et l&apos;accès aux informations est restreint. Toutefois, une sécurité absolue ne peut être garantie, et nous utilisons des moyens raisonnables et reconnus pour protéger les informations.</p>

      <H2 id="cookies">5. Cookies</H2>
      <p>Le site utilise des cookies essentiels à son fonctionnement et à l&apos;amélioration de l&apos;expérience (par exemple, la mémorisation des préférences). Vous pouvez bloquer les cookies dans les paramètres de votre navigateur, mais cela peut nuire à certaines fonctionnalités.</p>
      <p>Notre politique relative aux cookies explique comment le site et l&apos;application <b>SkiShare</b> (skisharebook.com) utilisent les cookies. Nous protégeons votre vie privée&nbsp;: en plus des cookies nécessaires au fonctionnement du site, nous utilisons <b>seulement deux outils de mesure tiers&nbsp;: le pixel de mesure d&apos;OpenAI</b>, pour savoir si nos annonces sur ChatGPT ont apporté des demandes et des réservations, <b>et Vercel Web Analytics</b>, pour compter les visites de manière globale. Sur les pages en anglais et en français, ils ne se chargent qu&apos;après votre accord aux cookies.</p>
      <H3>Que sont les cookies</H3>
      <p>Les cookies sont de petits fichiers texte enregistrés sur votre appareil lorsque vous utilisez le site&nbsp;; ils permettent le bon fonctionnement de services de base comme la connexion à un compte.</p>
      <H3>Les cookies que nous utilisons</H3>
      <UL>
        <li><b>Cookies essentiels (internes uniquement)&nbsp;:</b> nécessaires au fonctionnement du site&nbsp;: maintien de la session et connexion sécurisée au compte. Sans eux, il n&apos;est pas possible de se connecter ni de gérer une réservation.</li>
        <li><b>Préférences&nbsp;:</b> la mémorisation de votre accord à la politique relative aux cookies, afin que la question ne vous soit plus posée.</li>
        <li><b>Mesure publicitaire (tiers, OpenAI)&nbsp;:</b> le pixel de mesure OpenAI Ads enregistre les pages vues, une demande (un clic WhatsApp, un message dans le chat du site ou un lien de devis), le passage au paiement et une réservation terminée (le code de réservation et le montant). Nous ne lui transmettons ni nom, ni téléphone, ni e-mail, ni données de paiement. OpenAI utilise ces informations pour attribuer les actions sur le site à nos annonces, selon sa propre politique de confidentialité. Il ne fonctionne pas dans les espaces réservés à l&apos;équipe.</li>
        <li><b>Statistiques de visite (tiers, Vercel)&nbsp;:</b> Vercel Web Analytics compte les pages visitées, le site d&apos;origine, le pays et le type d&apos;appareil, de manière agrégée. Il ne dépose aucun cookie dans votre navigateur et ne vous identifie pas personnellement.</li>
      </UL>
      <H3>Ce que nous n&apos;utilisons <u>pas</u></H3>
      <UL>
        <li><b>Pas de reciblage&nbsp;:</b> nous n&apos;utilisons pas de cookies pour vous suivre avec des annonces sur d&apos;autres sites, et il n&apos;y a pas de publicité sur notre site.</li>
        <li><b>Pas d&apos;autres outils&nbsp;:</b> pas de Google Analytics, pas de Facebook Pixel ni d&apos;outils d&apos;analyse externes, en dehors du pixel de mesure d&apos;OpenAI et de Vercel Web Analytics décrits ci-dessus.</li>
        <li><b>Pas de partage avec des courtiers en données&nbsp;:</b> nous ne partageons pas vos données et ne les associons pas à des données de tiers à des fins de marketing ou de publicité.</li>
      </UL>
      <H3>Paiements</H3>
      <p>Les paiements sont traités directement par le prestataire de paiement <b>PayPlus</b>, sur une page sécurisée. Nous ne conservons pas de données de carte bancaire sur les serveurs du site.</p>
      <H3>Gérer les cookies</H3>
      <p>Vous pouvez bloquer ou supprimer les cookies dans les paramètres de votre navigateur ou de votre appareil. Bloquer les cookies essentiels peut vous empêcher de vous connecter et d&apos;utiliser certains services.</p>

      <H2>6. Vos droits</H2>
      <p>Conformément à la loi, vous pouvez consulter les informations collectées à votre sujet et demander leur rectification ou leur suppression. Pour nous contacter&nbsp;: <a href="mailto:skishareteam@gmail.com">skishareteam@gmail.com</a>.</p>

      <H2>7. Modifications</H2>
      <p>La Société peut mettre à jour cette politique de temps à autre. La version à jour sera publiée sur cette page.</p>
    </LegalPage>
  );
}

export default function Privacy({ lang }: { lang: Lang }) {
  return lang === "fr" ? <PrivacyFr /> : <PrivacyEn />;
}
