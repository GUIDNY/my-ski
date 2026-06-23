"use client";
import { useEffect, useState } from "react";

const KEY = "skishare_cookie_consent";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true); } catch {}
  }, []);

  const accept = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div dir="rtl"
      className="fixed inset-x-3 bottom-[80px] md:bottom-4 md:inset-x-auto md:right-4 md:max-w-sm z-[60]
                 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
      <p className="text-sm text-gray-700 leading-relaxed">
        אנחנו משתמשים בעוגיות (Cookies) כדי שהאתר יעבוד ולשיפור החוויה.
        בהמשך השימוש אתה מסכים ל<a href="/cookies" className="text-blue-600 font-semibold">מדיניות העוגיות</a>.
      </p>
      <div className="flex gap-2 mt-3">
        <button onClick={accept}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition">
          מאשר/ת
        </button>
        <a href="/privacy"
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
          פרטים
        </a>
      </div>
    </div>
  );
}
