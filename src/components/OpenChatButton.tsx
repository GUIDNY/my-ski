"use client";
import type { ReactNode } from "react";
import { OPEN_CHAT_EVENT } from "@/lib/helper-whatsapp";

/** A button that opens the site chat (the helper), from anywhere on a page. */
export default function OpenChatButton({ className, children, ariaLabel }: { className?: string; children: ReactNode; ariaLabel?: string }) {
  return (
    <button type="button" aria-label={ariaLabel} className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}>
      {children}
    </button>
  );
}
