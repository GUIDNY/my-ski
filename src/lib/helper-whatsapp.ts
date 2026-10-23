// The WhatsApp number the helper (the same assistant as the site chat)
// answers on. Public business number; override with NEXT_PUBLIC_HELPER_WHATSAPP.
export const HELPER_WHATSAPP = process.env.NEXT_PUBLIC_HELPER_WHATSAPP || "16623445081";

export function helperWaHref(text = "היי, הגעתי מהאתר"): string {
  return `https://wa.me/${HELPER_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

// Any button on the site can open the chat bubble (AiConcierge listens for it).
export const OPEN_CHAT_EVENT = "skishare:open-chat";
