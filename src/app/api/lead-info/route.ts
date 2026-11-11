import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { chatAdmin } from "@/lib/helper-chat";
import { phoneDigits } from "@/lib/sellers";
import { readLeadSources, saveLeadSource } from "@/lib/lead-sources";
import { sourceInText } from "@/lib/attribution";

/*
 * The lead's card in the leads screen: where the customer came from, and every quote
 * that was sent to him (the bot's and Idan's, /p/<id>), newest first.
 * GET ?lead=<web_session | phone> (Idan and the sellers).
 */
export const dynamic = "force-dynamic";
const LEAD = /^(web_[A-Za-z0-9_-]{16,64}|\d{8,15}|m_[a-z0-9]{10})$/;

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  const lead = req.nextUrl.searchParams.get("lead") || "";
  const phoneQ = phoneDigits(req.nextUrl.searchParams.get("phone") || "");
  if (!LEAD.test(lead)) return NextResponse.json({ ok: false }, { status: 400 });
  const db = createServerClient();

  let source = (await readLeadSources(db))[lead] ?? null;
  // WhatsApp: the site adds "מקור: …" to the first message; read it once and keep it
  if (!source && /^\d+$/.test(lead)) {
    const t = await chatAdmin({ action: "thread", lead }).catch(() => null);
    const msgs = ((t?.messages as { role: string; text: string }[]) || []).filter(m => m.role === "user");
    const hit = msgs.map(m => sourceInText(m.text)).find(Boolean);
    if (hit) { await saveLeadSource(db, lead, { src: hit }); source = { src: hit, at: new Date().toISOString() }; }
    else if (msgs.length) source = { src: "וואטסאפ ישירות (לא דרך האתר)", at: "" };
  }

  const phone = phoneQ || (/^\d+$/.test(lead) ? lead : "");
  let quotes: { id: string; number: string; createdAt: string; title: string; status: string }[] = [];
  if (phone.length >= 9) {
    const { data } = await db.from("proposals").select("id, proposal_number, client_phone, status, created_at, data")
      .ilike("client_phone", `%${phone.slice(-9)}%`).order("created_at", { ascending: false }).limit(20);
    quotes = (data ?? []).filter(p => phoneDigits(p.client_phone).endsWith(phone.slice(-9))).map(p => {
      const d = p.data as { title?: string; subtitle?: string } | null;
      return { id: p.id, number: p.proposal_number || "", createdAt: p.created_at, title: d?.subtitle || d?.title || "", status: p.status || "" };
    });
  }
  return NextResponse.json({ ok: true, source, quotes });
}
