"use client";
import { useEffect, useState } from "react";
import { PAY_EVENT } from "@/lib/pay-frame";

/* the secure payment window over the page (lib/pay-frame.ts) */
export default function PayFrame() {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const w = window as unknown as { __skisharePayFrame?: boolean };
    w.__skisharePayFrame = true;
    const on = (e: Event) => { setLoaded(false); setUrl(String((e as CustomEvent).detail || "")); };
    window.addEventListener(PAY_EVENT, on);
    return () => { window.removeEventListener(PAY_EVENT, on); w.__skisharePayFrame = false; };
  }, []);
  useEffect(() => {
    if (!url) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [url]);
  if (!url) return null;
  const he = (document.documentElement.lang || "he").startsWith("he");
  const fr = document.documentElement.lang.startsWith("fr");
  const title = he ? "תשלום מאובטח" : fr ? "Paiement sécurisé" : "Secure payment";
  const close = () => {
    const q = he ? "לסגור את חלון התשלום? אם כבר שילמתם, אל תסגרו עד שתראו אישור." : fr ? "Fermer le paiement ? Si vous avez déjà payé, attendez la confirmation." : "Close the payment? If you already paid, wait for the confirmation.";
    if (confirm(q)) setUrl(null);
  };
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-stretch md:items-center justify-center md:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-white w-full md:max-w-[560px] md:rounded-2xl overflow-hidden flex flex-col h-full md:h-[min(860px,92vh)] shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-4 h-14 border-b border-gray-100 shrink-0" dir={he ? "rtl" : "ltr"}>
          <span className="font-bold text-[15px] text-gray-900">🔒 {title} · PayPlus</span>
          <button type="button" onClick={close} className="w-10 h-10 rounded-full text-2xl text-gray-500 hover:bg-gray-100" aria-label={he ? "סגירה" : "Close"}>×</button>
        </div>
        <div className="relative flex-1">
          {!loaded && <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">{he ? "טוען את דף התשלום…" : fr ? "Chargement…" : "Loading…"}</div>}
          <iframe src={url} title={title} onLoad={() => setLoaded(true)} allow="payment *; publickey-credentials-get *"
            className="absolute inset-0 w-full h-full border-0" />
        </div>
      </div>
    </div>
  );
}
