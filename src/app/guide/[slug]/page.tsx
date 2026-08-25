import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import { GUIDES, getGuideBySlug } from "@/lib/guides";

const SITE_URL = "https://skisharebook.com";

export function generateStaticParams() {
  return GUIDES.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  const url = `${SITE_URL}/guide/${guide.slug}`;
  return {
    title: guide.metaTitle,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: guide.metaTitle,
      description: guide.description,
      url,
      siteName: "SkiShare",
      locale: "he_IL",
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: guide.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.description,
      images: ["/og.jpg"],
    },
  };
}

export default async function GuideArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const url = `${SITE_URL}/guide/${guide.slug}`;
  const related = GUIDES.filter(g => g.slug !== guide.slug).slice(0, 3);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: "he-IL",
    dateModified: guide.updated,
    author: { "@type": "Organization", name: "SkiShare" },
    publisher: { "@type": "Organization", name: "SkiShare", url: SITE_URL },
    mainEntityOfPage: url,
    about: "Val Thorens",
  };
  const faqLd = guide.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: guide.faqs.map(f => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "בית", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "מדריך ואל טורנס", item: `${SITE_URL}/guide` },
      { "@type": "ListItem", position: 3, name: guide.title, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-3xl mx-auto px-4 py-16">
        <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
          <a href="/" className="hover:text-blue-600">בית</a>
          <span>/</span>
          <a href="/guide" className="hover:text-blue-600">מדריך ואל טורנס</a>
        </nav>

        <div className="text-3xl mb-4">{guide.emoji}</div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">{guide.title}</h1>
        <p className="text-gray-500 leading-relaxed mb-10 text-lg">{guide.intro}</p>

        <div className="space-y-8">
          {guide.sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-xl font-black text-gray-900 mb-3">{s.heading}</h2>
              {s.paragraphs?.map((p, pi) => (
                <p key={pi} className="text-gray-600 leading-relaxed mb-3">{p}</p>
              ))}
              {s.list && (
                <ul className="space-y-2">
                  {s.list.map((item, li) => (
                    <li key={li} className="flex gap-2 text-gray-600 leading-relaxed">
                      <span className="text-blue-500 font-bold">•</span>{item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {guide.faqs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-black text-gray-900 mb-5">שאלות נפוצות</h2>
            <div className="space-y-4">
              {guide.faqs.map((f, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-bold text-gray-900 mb-2">{f.q}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
          <p className="text-gray-700 mb-4 font-medium">מתכננים חופשת סקי בואל טורנס?</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/apartments" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm">
              צפו בדירות
            </a>
            <a href="/search" className="inline-block bg-white border border-blue-200 hover:border-blue-400 text-blue-700 font-bold px-6 py-3 rounded-xl text-sm">
              בדקו זמינות
            </a>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-lg font-black text-gray-900 mb-4">עוד מדריכים על ואל טורנס</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(g => (
                <a key={g.slug} href={`/guide/${g.slug}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 transition-colors">
                  <div className="text-xl mb-2">{g.emoji}</div>
                  <div className="text-sm font-bold text-gray-900">{g.title}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
