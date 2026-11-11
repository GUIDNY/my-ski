"use client";
import { useState } from "react";

/*
 * "✉️ מייל": write to a customer by email (customers abroad, or when WhatsApp's 24-hour
 * window is closed). Opens a ready email in Gmail (your account) or the mail app, in
 * English, French or Hebrew, with the quote link when there is one.
 */
type Lang = "en" | "fr" | "he";
const T: Record<Lang, (n: string, link: string) => { subject: string; body: string }> = {
  en: (n, link) => ({
    subject: "Your ski holiday in Val Thorens – SkiShare",
    body: `Hi ${n || "there"},\n\nThank you for your interest in a ski holiday with SkiShare in Val Thorens.\n${link ? `\nHere is your personal quote: ${link}\n` : ""}\nI'm happy to answer any question, or adjust dates, apartments and extras for you.\n\nBest regards,\nIdan\nSkiShare · skisharebook.com\nWhatsApp: +972 55-517-4903`,
  }),
  fr: (n, link) => ({
    subject: "Vos vacances au ski à Val Thorens – SkiShare",
    body: `Bonjour ${n || ""},\n\nMerci pour votre intérêt pour des vacances au ski avec SkiShare à Val Thorens.\n${link ? `\nVoici votre devis personnel : ${link}\n` : ""}\nJe reste à votre disposition pour toute question, ou pour adapter les dates, les appartements et les options.\n\nBien cordialement,\nIdan\nSkiShare · skisharebook.com\nWhatsApp : +972 55-517-4903`,
  }),
  he: (n, link) => ({
    subject: "החופשה שלכם בואל טורנס – SkiShare",
    body: `היי ${n || ""},\n\nתודה על הפנייה לחופשת סקי בואל טורנס.\n${link ? `\nזו ההצעה האישית שלכם: ${link}\n` : ""}\nאשמח לענות על כל שאלה, או לשנות תאריכים, דירות ותוספות.\n\nבברכה,\nעידן\nSkiShare · skisharebook.com`,
  }),
};

export default function EmailCustomer({ to = "", name = "", link = "", phone = "", className = "" }: { to?: string; name?: string; link?: string; phone?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(to);
  const digits = phone.replace(/\D/g, "");
  const first: Lang = /^972|^05/.test(digits) ? "he" : /^33/.test(digits) || /\.(fr|be)$/i.test(to) ? "fr" : "en";
  const [lang, setLang] = useState<Lang>(first);
  const t = T[lang](name.split(/[ ,]/)[0] || "", link);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const subj = subject || t.subject, text = body || t.body;
  const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.trim())}&su=${encodeURIComponent(subj)}&body=${encodeURIComponent(text)}`;
  const mailto = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(text)}`;
  if (!open) return (
    <button type="button" onClick={() => setOpen(true)} className={className || "border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm px-3 py-2 rounded-xl transition"}>✉️ מייל</button>
  );
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6" onClick={() => setOpen(false)}>
      <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg text-gray-900">מייל ללקוח{name ? ` · ${name}` : ""}</h3>
          <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl" aria-label="סגירה">×</button>
        </div>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="כתובת המייל של הלקוח" dir="ltr" type="email"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
        <div className="flex gap-1.5">
          {(["en", "fr", "he"] as Lang[]).map(l => (
            <button key={l} type="button" onClick={() => { setLang(l); setSubject(""); setBody(""); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${lang === l ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600"}`}>
              {l === "en" ? "English" : l === "fr" ? "Français" : "עברית"}
            </button>
          ))}
        </div>
        <input value={subj} onChange={e => setSubject(e.target.value)} dir={lang === "he" ? "rtl" : "ltr"}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-blue-500" />
        <textarea value={text} onChange={e => setBody(e.target.value)} rows={10} dir={lang === "he" ? "rtl" : "ltr"}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
        <div className="flex flex-wrap gap-2">
          <a href={ok ? gmail : undefined} target="_blank" rel="noreferrer" aria-disabled={!ok}
            className={`flex-1 text-center font-bold text-sm px-4 py-2.5 rounded-xl ${ok ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400 pointer-events-none"}`}>פתיחה ב-Gmail</a>
          <a href={ok ? mailto : undefined} aria-disabled={!ok}
            className={`flex-1 text-center font-bold text-sm px-4 py-2.5 rounded-xl border ${ok ? "border-gray-200 text-gray-700 hover:bg-gray-50" : "border-gray-100 text-gray-300 pointer-events-none"}`}>אפליקציית המייל</a>
        </div>
        {!ok && <p className="text-xs text-amber-700">כתבו כתובת מייל כדי לשלוח.</p>}
      </div>
    </div>
  );
}
