// The WhatsApp number the helper (the same assistant as the site chat)
// answers on: +972 55-517-4903, the customers' number (from 24.10.2026; before
// that +1 662-344-5081, which now stays for Eddie). Override with NEXT_PUBLIC_HELPER_WHATSAPP.
export const HELPER_WHATSAPP = process.env.NEXT_PUBLIC_HELPER_WHATSAPP || "972555174903";

export function helperWaHref(text = "היי, הגעתי מהאתר"): string {
  return `https://wa.me/${HELPER_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

// Any button on the site can open the chat bubble (AiConcierge listens for it).
export const OPEN_CHAT_EVENT = "skishare:open-chat";
