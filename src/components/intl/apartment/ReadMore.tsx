"use client";
import { useState } from "react";
import { btn } from "@/components/ui";
import type { Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";

/** The description: all of it is in the HTML, long ones are folded to a few lines until "Read more". */
export default function ReadMore({ lang, text }: { lang: Lang; text: string }) {
  const t = DICT[lang].apt;
  const [open, setOpen] = useState(false);
  const long = text.length > 320 || text.split("\n").length > 5;
  return (
    <div>
      <p className={`text-[16px] md:text-[17px] leading-[1.75] text-body whitespace-pre-line ${long && !open ? "line-clamp-6" : ""}`}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} className={`${btn.link} mt-2 min-h-[44px]`}>
          {open ? t.readLess : t.readMore}
        </button>
      )}
    </div>
  );
}
