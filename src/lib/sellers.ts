// Salespeople: they sign in with their own email and get the seller area (/seller):
// the WhatsApp/site leads (reading and answering), the quotes with the profit behind
// them, their orders and their share of the profit. Safe to import in the browser.
export type Seller = { email: string; name: string; share: number };

export const SELLERS: Seller[] = [
  // share = his part of OUR profit on each of his orders (Idan, 4.11.2026: 20% of the profit)
  { email: "raklaplay@gmail.com", name: "איש מכירות", share: 0.2 },
  { email: "mayabs2025@gmail.com", name: "מאיה", share: 0.2 }, // added by Idan 4.11.2026, same 20%
];

export function sellerByEmail(email?: string | null): Seller | null {
  const e = (email ?? "").trim().toLowerCase();
  return e ? SELLERS.find(s => s.email === e) ?? null : null;
}

export const isSellerEmail = (email?: string | null) => !!sellerByEmail(email);

/** phone → digits in international form (0541234567 → 972541234567), the way leads are keyed */
export function phoneDigits(s: string | null | undefined): string {
  let d = String(s || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (/^05\d{8}$/.test(d)) d = "972" + d.slice(1);
  return d;
}
