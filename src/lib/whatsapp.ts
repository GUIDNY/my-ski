// Central WhatsApp helper — all "booking" CTAs route here (until card payment is added).
// Phone in international format (no +, no leading 0). 0547701899 → 972547701899
export const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "972547701899";

type WaOpts = {
  intro?: string;
  lines: (string | null | false | undefined)[];
  total?: number;
  pageUrl?: string;
};

export function buildWaHref({ intro, lines, total, pageUrl }: WaOpts): string {
  const body = [
    intro ?? "היי! 👋 אני מעוניין/ת בהזמנה הבאה:",
    "",
    ...lines.filter((l): l is string => Boolean(l)),
    ...(total != null ? ["", `💰 סה״כ: €${total.toLocaleString()}`] : []),
    ...(pageUrl ? [`\n🔗 ${pageUrl}`] : []),
  ].join("\n");
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(body)}`;
}
