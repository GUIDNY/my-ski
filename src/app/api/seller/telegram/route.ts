import { NextRequest, NextResponse } from "next/server";
import { sellerAccess } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase-server";
import { readSellerConfig, sellerData, updateSellerConfig } from "@/lib/seller-store";
import { connectCode, findStartChat, telegramBotName, telegramConfigured, telegramSend } from "@/lib/telegram";

/*
 * The seller links his Telegram for the alerts: he opens t.me/<bot>?start=<code>,
 * presses Start, and "בדיקה" here finds his chat and saves it.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  if (!telegramConfigured()) return NextResponse.json({ ok: true, configured: false });
  const bot = await telegramBotName();
  if (!access.seller) return NextResponse.json({ ok: true, configured: true, bot });
  const s = sellerData(await readSellerConfig(createServerClient()), access.seller.email);
  const code = connectCode(access.seller.email);
  return NextResponse.json({ ok: true, configured: true, bot, connected: !!s.telegram, link: bot ? `https://t.me/${bot}?start=${code}` : null });
}

export async function POST(req: NextRequest) {
  const access = await sellerAccess(req);
  if (access instanceof NextResponse) return access;
  if (!access.seller) return NextResponse.json({ ok: false, error: "sellers only" }, { status: 403 });
  if (!telegramConfigured()) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  const { action } = await req.json().catch(() => ({}));
  const email = access.seller.email;
  const db = createServerClient();

  if (action === "connect") {
    const chat = await findStartChat(connectCode(email));
    if (!chat) return NextResponse.json({ ok: false, error: "not found" });
    await updateSellerConfig(db, cfg => { const s = sellerData(cfg, email); s.telegram = chat; cfg.sellers[email] = s; });
    await telegramSend(chat, "✅ מחובר! מעכשיו יגיעו לכאן התראות על לידים חדשים בוואטסאפ ועל הצעות מחיר שנשלחו.");
    return NextResponse.json({ ok: true });
  }
  if (action === "test") {
    const s = sellerData(await readSellerConfig(db), email);
    if (!s.telegram) return NextResponse.json({ ok: false, error: "not connected" });
    return NextResponse.json({ ok: await telegramSend(s.telegram, "🔔 בדיקה: ההתראות של SkiShare עובדות.") });
  }
  if (action === "disconnect") {
    await updateSellerConfig(db, cfg => { const s = sellerData(cfg, email); delete s.telegram; cfg.sellers[email] = s; });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}
