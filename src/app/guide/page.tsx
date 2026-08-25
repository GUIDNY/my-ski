import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "מדריך ואל טורנס — כל מה שצריך לדעת | SkiShare",
  description:
    "המדריך המקיף לחופשת סקי בואל טורנס: מתי לנסוע, איך מגיעים, מחירי סקי פס, המלצות למשפחות, אפרה סקי ועוד — כל המידע שצריך לפני שטסים.",
  alternates: { canonical: "/guide" },
  openGraph: {
    type: "website",
    title: "מדריך ואל טורנס — כל מה שצריך לדעת",
    description: "המדריך המקיף לחופשת סקי בואל טורנס — עונה, טיסות, סקי פס, משפחות, אפרה סקי ועוד.",
    url: "/guide",
  },
};

export default function GuideIndex() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <a href="/" className="text-sm text-blue-600 hover:underline">→ חזור לעמוד הבית</a>

        <span className="block mt-8 mb-3 text-xs font-bold tracking-widest uppercase text-blue-600">מדריך ואל טורנס</span>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">כל מה שצריך לדעת על ואל טורנס</h1>
        <p className="text-gray-500 max-w-2xl mb-12 leading-relaxed">
          מדריכים מקיפים לתכנון חופשת הסקי המושלמת ב-Val Thorens — עונה ומזג אוויר, איך מגיעים מישראל,
          מחירי סקי פס, מסלולים, חיי לילה, לינה ועוד. כל המידע שצריך לפני שסוגרים טיסות.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {GUIDES.map(g => (
            <a
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="block bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-3">{g.emoji}</div>
              <h2 className="text-lg font-black text-gray-900 mb-2">{g.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{g.description}</p>
              <span className="inline-block mt-4 text-sm font-bold text-blue-600">קרא עוד ←</span>
            </a>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
          <p className="text-gray-700 mb-4 font-medium">מוכנים לתכנן את החופשה?</p>
          <a href="/apartments" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-sm">
            צפו בדירות בואל טורנס
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
