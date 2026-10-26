"use client";
import { useState } from "react";
import { btn } from "@/components/ui";

export default function GoButton({ href }: { href: string }) {
  const [agreed, setAgreed] = useState(false);
  const [warn, setWarn] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); setWarn(false); }} className="mt-1 w-5 h-5 shrink-0 accent-[#1652F0]" />
        <span className="text-[15px] text-body leading-relaxed">
          קראתי את <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent underline font-bold">התקנון ומדיניות הביטולים</a> ואת <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent underline font-bold">מדיניות הפרטיות</a>, והם מקובלים עליי.
        </span>
      </label>
      {warn && <p role="alert" className="text-[14px] text-danger">כדי להמשיך לתשלום יש לסמן שהתקנון מקובל עליכם.</p>}
      <button type="button" onClick={() => (agreed ? window.location.assign(href) : setWarn(true))} className={`${btn.primary} w-full`}>
        להמשך לתשלום מאובטח
      </button>
    </div>
  );
}
