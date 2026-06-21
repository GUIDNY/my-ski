import Logo from "@/components/Logo";

export default function LegalShell({
  title, updated, children,
}: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f9fb]" dir="rtl">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900 transition">→ חזרה לאתר</a>
          <a href="/"><Logo className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="font-display text-3xl md:text-4xl font-black text-gray-900">{title}</h1>
        <p className="text-sm text-gray-400 mt-2 mb-8">עודכן: {updated}</p>
        <article className="legal space-y-5 text-gray-700 leading-relaxed text-[15px]">
          {children}
        </article>

        <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500 space-y-1">
          <p className="font-bold text-gray-700">סקי שר בע״מ · SkiShare</p>
          <p>ח.פ: 517332060 · הזוהר 12, קיסריה</p>
          <p>טלפון: <a href="tel:+972547701899" className="text-blue-600">054-7701899</a> · דוא״ל: <a href="mailto:skishareteam@gmail.com" className="text-blue-600">skishareteam@gmail.com</a></p>
        </div>
      </main>
    </div>
  );
}

/* small helpers for legal content */
export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl font-black text-gray-900 pt-4">{children}</h2>;
}
export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}
export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pr-5 space-y-1.5">{children}</ul>;
}
