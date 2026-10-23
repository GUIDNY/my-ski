/*
 * Shared facts for structured data (JSON-LD) on every page. Plain data, safe
 * to import from server and client code. Only facts we can stand behind:
 * sameAs links point to pages that exist.
 */
export const SITE = "https://skisharebook.com";
/** the business on social networks (footer, about page, Organization sameAs) */
export const SOCIAL = { instagram: "https://www.instagram.com/ski_share/", facebook: "https://www.facebook.com/profile.php?id=100094751621075" };
export const ORG_ID = `${SITE}/#org`;
export const WEBSITE_ID = `${SITE}/#website`;
export const VT_ID = `${SITE}/#val-thorens`;

/** a path as a full address, with Hebrew letters percent-encoded */
export const siteUrl = (path = "/") => SITE + encodeURI(path.startsWith("/") ? path : `/${path}`);

/** Val Thorens, the place the apartments are in */
export const VAL_THORENS = {
  "@type": "TouristDestination",
  "@id": VT_ID,
  name: "ואל טורנס",
  alternateName: ["Val Thorens", "ואל תורנס"],
  geo: { "@type": "GeoCoordinates", latitude: 45.2975, longitude: 6.5803 },
  containedInPlace: { "@type": "Place", name: "Les 3 Vallées" },
  sameAs: ["https://en.wikipedia.org/wiki/Val_Thorens", "https://www.valthorens.com/"],
};

/** the business and the site, once per page (other blocks point at them by @id) */
export const SITE_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TravelAgency",
      "@id": ORG_ID,
      name: "SkiShare",
      alternateName: ["סקי שר", "Ski Share"],
      url: `${SITE}/`,
      logo: { "@type": "ImageObject", url: `${SITE}/skishare-logo.png` },
      image: `${SITE}/og.jpg`,
      description: "SkiShare (סקי שר) היא חברה ישראלית להשכרת דירות בואל טורנס, צרפת: דירות משלה ודירות לשבוע (שבת עד שבת), עם הזמנה ותשלום באתר ושירות בעברית. מוסיפים סקי פס, הסעה משדה התעופה, ציוד, וטיסה ישירה כשיש. כל אחד מהחבורה משלם את החלק שלו.",
      slogan: "חברה ישראלית להשכרת דירות בואל טורנס",
      foundingLocation: { "@type": "Place", name: "Israel" },
      email: "skishareteam@gmail.com",
      telephone: "+972547701899",
      address: { "@type": "PostalAddress", streetAddress: "הזוהר 12", addressLocality: "קיסריה", addressCountry: "IL" },
      areaServed: { "@type": "Country", name: "Israel" },
      knowsLanguage: ["he", "en", "fr"],
      knowsAbout: [{ "@id": VT_ID }, "Les 3 Vallées", "חופשות סקי"],
      contactPoint: [{
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "skishareteam@gmail.com",
        telephone: "+972547701899",
        availableLanguage: ["he", "en"],
      }],
      sameAs: ["https://apps.apple.com/app/id6782095727", "https://www.instagram.com/ski_share/", "https://www.facebook.com/profile.php?id=100094751621075"],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: `${SITE}/`,
      name: "SkiShare",
      alternateName: "סקי שר",
      // the Hebrew site, and the English and French one (/en, /fr)
      inLanguage: ["he-IL", "en", "fr"],
      publisher: { "@id": ORG_ID },
    },
    VAL_THORENS,
  ],
};

/** JSON for a <script type="application/ld+json">, safe inside HTML */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

/** BreadcrumbList from [name, path] pairs (the last one is the page itself) */
export const breadcrumbLd = (items: [string, string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: siteUrl(path) })),
});

/** FAQPage from the questions shown on the page (the text must match what people see) */
export const faqLd = (faq: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});
