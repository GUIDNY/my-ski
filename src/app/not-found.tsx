import type { Metadata } from "next";
import Link from "next/link";
import OpenChatButton from "@/components/OpenChatButton";
import { btn, wrap } from "@/components/ui";

export const metadata: Metadata = {
  title: "העמוד לא נמצא | SkiShare",
};

export default function NotFound() {
  return (
    <div dir="rtl" className={`${wrap} flex-1 flex items-center justify-center py-20 md:py-28`}>
      <div className="max-w-[520px] text-center flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/skishare-mark.png" alt="" aria-hidden="true" className="h-10 w-auto opacity-80" />
        <h1 className="font-display font-extrabold text-[32px] md:text-[40px] tracking-tight text-ink">העמוד הזה לא נמצא</h1>
        <p className="text-[16px] md:text-[17px] leading-relaxed text-muted">
          אולי הקישור ישן או שיש בו טעות. אפשר להתחיל מהחיפוש, או לכתוב לנו ונמצא את מה שחיפשתם.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Link href="/search?deal=full" className={btn.primary}>לחיפוש חבילה</Link>
          <OpenChatButton className={btn.outline}>לכתוב לעוזר שלנו</OpenChatButton>
        </div>
        <Link href="/" className="text-[15px] font-bold text-accent hover:text-accent-hover mt-1">לדף הבית</Link>
      </div>
    </div>
  );
}
