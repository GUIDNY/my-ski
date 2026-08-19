import Logo from "@/components/Logo";

export default function LegalShell({
  title, updated, children,
}: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--ivory)" }} dir="rtl">
      <header className="sticky top-0 z-30" style={{ background: "var(--paper)", borderBottom: "1px solid rgba(22,32,46,0.08)" }}>
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="/" className="text-sm transition hover:text-[var(--accent-deep)]" style={{ color: "var(--stone)" }}>→ חזרה לאתר</a>
          <a href="/"><Logo className="h-8" /></a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-14">
        <span className="eyebrow block mb-3">מסמך משפטי</span>
        <h1 className="font-display text-3xl md:text-4xl font-medium" style={{ color: "var(--charcoal)" }}>{title}</h1>
        <p className="text-sm mt-2 mb-8" style={{ color: "var(--stone-soft)" }}>עודכן: {updated}</p>
        <div className="hr-hairline mb-8" />
        <article className="legal space-y-5 leading-relaxed text-[15px]" style={{ color: "var(--stone)" }}>
          {children}
        </article>

        <div className="mt-14 pt-6 text-sm space-y-1" style={{ borderTop: "1px solid rgba(22,32,46,0.08)", color: "var(--stone)" }}>
          <p className="font-bold" style={{ color: "var(--charcoal)" }}>סקי שר בע״מ · SkiShare</p>
          <p>ח.פ: 517332060 · הזוהר 12, קיסריה</p>
          <p>טלפון: <a href="tel:+972547701899" style={{ color: "var(--accent-deep)" }}>054-7701899</a> · דוא״ל: <a href="mailto:skishareteam@gmail.com" style={{ color: "var(--accent-deep)" }}>skishareteam@gmail.com</a></p>
        </div>
      </main>
    </div>
  );
}

/* small helpers for legal content */
export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl font-medium pt-4" style={{ color: "var(--charcoal)" }}>{children}</h2>;
}
export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}
export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pr-5 space-y-1.5">{children}</ul>;
}
