import { buildSiteProposal } from "@/lib/site-proposal";
import { ogCard, proposalCard } from "@/lib/og-card";

export const runtime = "nodejs";
export const maxDuration = 30;

/* The link preview of the two-apartment page (/combo?a&b&checkin&checkout&guests): see lib/og-card. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const choices: Record<string, string> = {
    apartment_id: sp.get("a") || "", apartment_id2: sp.get("b") || "",
    checkin: sp.get("checkin") || "", checkout: sp.get("checkout") || "", guests: sp.get("guests") || "2",
  };
  const r = await buildSiteProposal(k => choices[k] || "").catch(() => null);
  if (!r) return ogCard({ photos: ["/view.jpg"], kicker: "ואל טורנס", title: "שתי דירות יחד, לכל החבורה", facts: "הזמנה אחת · כל אחד משלם את החלק שלו" }, 86400);
  return ogCard(proposalCard(r.data, "שתי דירות יחד · ואל טורנס"));
}
